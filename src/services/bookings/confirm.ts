"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { dayKeyIn, zonedToIso } from "@/services/calendar/dates";
import { flagBookingForClient } from "@/services/changes/flag";
import { syncProjectPayment } from "@/services/invoices/ledger";
import { inviteToProject } from "@/services/projects/invitations";
import { latestBookingQuote, quoteTotalOf } from "./booking-quote";
import { bookingCompleteness } from "./completeness";
import { notifyProjectCreated } from "./notify-project";
import { CONFIRMED_WITHOUT_CLIENT } from "./options";
import { confirmBookingSchema } from "./schemas";

const DEFAULT_SHOOT_MINUTES = 120;
const MINUTES_PER_DAY = 24 * 60;

/** `14:00` + 90 min → `15:30`, stopping at the end of the day. */
function addMinutes(time: string, minutes: number) {
	const [hours, mins] = time.split(":").map(Number);
	const total = Math.min(hours * 60 + mins + minutes, MINUTES_PER_DAY - 1);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Confirms a booking and opens the operational project from it: same details,
 * a calendar slot, and the client. A client who already accepted the request
 * gets the project directly; anyone else is invited to it. A request never
 * becomes a project before this point.
 */
export async function confirmBooking(input: unknown): Promise<
	ActionResult<{
		projectId: string;
		invite: "linked" | "linkedSilent" | "sent" | "failed" | "none";
	}>
> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = confirmBookingSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, withoutClient } = parsed.data;

	const booking = await db.booking.findFirst({
		where: { id, photographerId },
	});
	if (!booking) return fail("notFound");
	if (booking.status === "CONFIRMED" || booking.projectId)
		return fail("alreadyConfirmed");
	// Enough to run the job: when, and what was agreed.
	if (bookingCompleteness(booking).required.length > 0)
		return fail("bookingIncomplete");
	// The client reviews and accepts the request first, unless the
	// photographer explicitly confirms without them.
	const accepted = booking.clientAcceptedAt !== null;
	if (!accepted && !withoutClient) return fail("bookingNotAccepted");
	// The price was proposed as a quote: the client must have accepted it.
	// Accepting the request accepts the quote that went with it (sending or
	// editing either one asks for a new answer), so a sent quote on an
	// accepted request counts as accepted and is recorded so below.
	const quote = await latestBookingQuote(db, id);
	const quoteAccepted =
		quote?.status === "ACCEPTED" || (quote?.status === "SENT" && accepted);
	if (quote && !quoteAccepted && !withoutClient)
		return fail("bookingQuoteNotAccepted");
	const { desiredDate } = booking;
	if (!desiredDate) return fail("bookingIncomplete");

	const timeZone = await getRequestTimeZone();
	const day = desiredDate.toISOString().slice(0, 10);
	const { startTime, durationMinutes } = booking;
	const endTime = startTime
		? addMinutes(startTime, durationMinutes ?? DEFAULT_SHOOT_MINUTES)
		: null;
	const startsAt = startTime
		? new Date(zonedToIso(day, startTime, timeZone))
		: desiredDate;
	const endsAt =
		startTime && endTime
			? new Date(
					zonedToIso(dayKeyIn(startsAt.getTime(), timeZone), endTime, timeZone),
				)
			: desiredDate;

	// The client accepted from their account: the project is theirs at once, with
	// no second invitation to answer.
	const linkedClientId = accepted ? booking.clientId : null;

	const projectId = await db.$transaction(async (tx) => {
		// Claims the booking first, so two clicks can't create two projects.
		const claimed = await tx.booking.updateMany({
			where: {
				id,
				photographerId,
				status: { not: "CONFIRMED" },
				projectId: null,
			},
			data: {
				status: "CONFIRMED",
				confirmedAt: new Date(),
				statusReason: null,
			},
		});
		if (claimed.count === 0) return null;

		const project = await tx.project.create({
			data: {
				photographerId,
				title: booking.title,
				serviceType: booking.serviceType,
				mediaType: booking.mediaType,
				description: booking.description,
				clientPhone: booking.clientPhone,
				eventDate: desiredDate,
				startTime,
				endTime,
				location: booking.location,
				// What the client accepted, extras included.
				price: quote ? quoteTotalOf(quote) : booking.proposedPrice,
				internalNotes: booking.internalNotes,
				...(linkedClientId && {
					clientId: linkedClientId,
					inviteStatus: "ACCEPTED" as const,
					inviteEmail: booking.clientEmail?.toLowerCase() || null,
					invitePhone: toE164(booking.clientPhone ?? ""),
					invitedAt: new Date(),
				}),
			},
			select: { id: true },
		});
		await tx.booking.update({
			where: { id },
			data: { projectId: project.id },
		});
		// The quote follows the project, where it becomes the invoice.
		if (quote)
			await tx.quote.update({
				where: { id: quote.id },
				data: {
					projectId: project.id,
					...(quote.status === "SENT" &&
						accepted && {
							status: "ACCEPTED" as const,
							respondedAt: booking.clientAcceptedAt,
						}),
				},
			});
		// An invoice already made from that quote belongs to the project too,
		// and what was paid on it becomes the project's payment.
		if (quote?.invoiceId) {
			await tx.invoice.update({
				where: { id: quote.invoiceId },
				data: { projectId: project.id },
			});
			await syncProjectPayment(tx, project.id);
		}
		await tx.calendarEvent.create({
			data: {
				photographerId,
				projectId: project.id,
				type: "SHOOT",
				title: booking.title,
				allDay: !startTime,
				startsAt,
				endsAt,
				location: booking.location,
			},
		});
		await tx.bookingActivity.create({
			data: {
				bookingId: id,
				kind: "STATUS",
				fromStatus: booking.status,
				toStatus: "CONFIRMED",
				body: accepted ? null : CONFIRMED_WITHOUT_CLIENT,
			},
		});
		return project.id;
	});
	// The project starts at Booking; preparation is the photographer's call.
	if (!projectId) return fail("alreadyConfirmed");

	// The project exists either way; a failed invite can be retried from it.
	// Without an email or phone number there is no one to invite.
	let invite: "linked" | "linkedSilent" | "sent" | "failed" | "none" = "none";
	if (linkedClientId) {
		// Already has access: just tell them the booking is confirmed.
		const told = await notifyProjectCreated({
			clientId: linkedClientId,
			photographerId,
			projectId,
			project: booking.title,
			fallbackEmail: booking.clientEmail,
			fallbackPhone: booking.clientPhone,
		});
		invite = told ? "linked" : "linkedSilent";
	}
	// By email when there is one, else texted to the phone number.
	const contact = booking.clientEmail ?? booking.clientPhone;
	if (contact && !linkedClientId) {
		const invited = await inviteToProject(
			{ id: photographerId, email: session.user.email },
			projectId,
			contact,
		);
		invite = invited.ok && invited.data.sent ? "sent" : "failed";
	}
	// Lights the booking up in their space; the notices above told them.
	await flagBookingForClient(id, {});

	revalidatePath("/dashboard", "layout");
	revalidatePath("/portal", "layout");
	return ok({ projectId, invite });
}
