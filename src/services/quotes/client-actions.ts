"use server";

import { getTranslations } from "next-intl/server";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { bookingCompleteness } from "@/services/bookings/completeness";
import { OPEN_STATUSES } from "@/services/bookings/options";
import {
	flagBookingForStudio,
	flagProjectForStudio,
} from "@/services/changes/flag";
import { sendMessage } from "@/services/messages/actions";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { respondQuoteSchema } from "./schemas";

/**
 * The client accepts or declines a quote sent to their account. For a
 * booking's quote, `needsDetails` says the request still lacks what only they
 * can give (date, time, place): accepting the price then leaves the request
 * open for them to complete and accept.
 */
export async function respondToQuote(
	input: unknown,
): Promise<ActionResult<{ bookingId: string | null; needsDetails: boolean }>> {
	const { clientId } = await requireClient();
	const parsed = respondQuoteSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, accept, note } = parsed.data;
	// Only a sent quote, not yet invoiced, waits for an answer.
	const { count } = await db.quote.updateMany({
		where: { id, clientId, status: "SENT", invoiceId: null },
		data: {
			status: accept ? "ACCEPTED" : "DECLINED",
			respondedAt: new Date(),
			clientNote: note,
		},
	});
	if (count === 0) return fail("quoteNotOpen");
	const quote = await db.quote.findUnique({
		where: { id },
		select: {
			bookingId: true,
			projectId: true,
			number: true,
			photographerId: true,
		},
	});
	let needsDetails = false;
	if (quote?.bookingId) {
		const booking = await db.booking.findFirst({
			where: {
				id: quote.bookingId,
				status: { in: [...OPEN_STATUSES] },
				projectId: null,
			},
			select: {
				desiredDate: true,
				startTime: true,
				location: true,
				proposedPrice: true,
			},
		});
		// Accepting the price accepts the request only once it is complete;
		// declining it reopens the request, to talk it over.
		needsDetails =
			accept &&
			booking !== null &&
			bookingCompleteness(booking, { forClient: true }).required.length > 0;
		if (booking)
			await db.booking.update({
				where: { id: quote.bookingId },
				data: !accept
					? { clientAcceptedAt: null }
					: needsDetails
						? { clientId }
						: { clientAcceptedAt: new Date(), clientId },
			});
		await flagBookingForStudio(quote.bookingId);
	} else if (quote?.projectId) await flagProjectForStudio(quote.projectId);

	// The note also lands in their conversation, so the studio can answer it.
	if (note && quote) {
		const t = await getTranslations("Quotes.portal");
		await sendMessage({
			as: "client",
			conversationId: null,
			partnerId: quote.photographerId,
			body: t(accept ? "noteAccepted" : "noteDeclined", {
				number: quote.number,
				note,
			}),
		}).catch(() => console.error("Failed to post the quote note."));
	}

	revalidateClientWork();
	return ok({ bookingId: quote?.bookingId ?? null, needsDetails });
}
