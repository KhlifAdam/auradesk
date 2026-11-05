"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { getRequestLocale } from "@/lib/mail/request-locale";
import { sendBookingSentEmail } from "@/lib/mail/send-client-notices";
import { toE164 } from "@/lib/phone";
import { sendBookingSentSms } from "@/lib/sms/send-client-sms";
import { flagBookingForClient } from "@/services/changes/flag";
import { idSchema } from "@/services/shared/schemas";
import { isOpenStatus } from "./options";

/**
 * Sends the request to the client: it appears in their portal, where they can
 * read it, fill in their part (location, date…) and accept or decline. The
 * client is told by email, or by text message when there is no email.
 */
export async function sendBookingToClient(
	input: unknown,
): Promise<ActionResult<{ notified: boolean }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const id = parsed.data;

	const booking = await db.booking.findFirst({
		where: { id, photographerId },
		include: {
			photographer: {
				select: { name: true, studio: { select: { name: true } } },
			},
		},
	});
	if (!booking) return fail("notFound");
	if (!isOpenStatus(booking.status)) return fail("bookingLocked");
	const phone = booking.clientPhone ? toE164(booking.clientPhone) : null;
	if (!booking.clientEmail && !phone) return fail("bookingNoContact");

	await db.$transaction([
		db.booking.update({
			where: { id },
			data: {
				sentToClientAt: new Date(),
				// A new version of the request needs a new answer.
				clientAcceptedAt: null,
				status: booking.status === "NEW" ? "DISCUSSION" : booking.status,
			},
		}),
		db.bookingActivity.create({
			data: {
				bookingId: id,
				kind: "SENT",
				fromStatus: booking.status,
				toStatus: booking.status === "NEW" ? "DISCUSSION" : booking.status,
			},
		}),
	]);

	const notified = await notifyClient({ booking, phone });
	// Lights it up in their space; the notice above already told them.
	await flagBookingForClient(id, {});
	revalidatePath("/dashboard", "layout");
	revalidatePath("/portal", "layout");
	return ok({ notified });
}

type BookingWithStudio = Prisma.BookingGetPayload<{
	include: {
		photographer: {
			select: { name: true; studio: { select: { name: true } } };
		};
	};
}>;

async function notifyClient({
	booking,
	phone,
}: {
	booking: BookingWithStudio;
	phone: string | null;
}) {
	const studio = booking.photographer.studio?.name ?? booking.photographer.name;
	try {
		// Someone who already has an account goes straight to the request;
		// a new person is taken to sign up with the same contact.
		const account = await db.user.findFirst({
			where: {
				OR: [
					...(booking.clientEmail
						? [
								{
									email: {
										equals: booking.clientEmail,
										mode: "insensitive" as const,
									},
								},
							]
						: []),
					...(phone ? [{ phoneNumber: phone }] : []),
				],
			},
			select: { locale: true },
		});
		const locale = resolveMailLocale(account?.locale, await getRequestLocale());
		const requestPath = `/portal/bookings/${booking.id}`;

		if (booking.clientEmail) {
			await sendBookingSentEmail({
				to: booking.clientEmail,
				locale,
				studio,
				booking: booking.title,
				path: account
					? requestPath
					: `/client/register?email=${encodeURIComponent(booking.clientEmail)}`,
			});
		} else if (phone) {
			await sendBookingSentSms({
				to: phone,
				locale,
				studio,
				booking: booking.title,
				path: account
					? requestPath
					: `/client/phone?phone=${encodeURIComponent(phone)}`,
			});
		}
		return true;
	} catch (error) {
		console.error("Failed to send the booking request to the client:", error);
		return false;
	}
}
