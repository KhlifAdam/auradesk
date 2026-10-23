"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { dayKeyIn, zonedToIso } from "@/services/calendar/dates";
import { advanceProjectStage } from "@/services/projects/auto-stage";
import { inviteToProject } from "@/services/projects/invitations";
import { bookingCompleteness } from "./completeness";
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
 * a calendar slot, and an invitation to the client. A request never becomes a
 * project before this point.
 */
export async function confirmBooking(
	input: unknown,
): Promise<
	ActionResult<{ projectId: string; invite: "sent" | "failed" | "none" }>
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
				price: booking.proposedPrice,
				internalNotes: booking.internalNotes,
			},
			select: { id: true },
		});
		await tx.booking.update({
			where: { id },
			data: { projectId: project.id },
		});
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
	if (!projectId) return fail("alreadyConfirmed");
	// The booking is settled: the project starts at preparation.
	await advanceProjectStage(projectId, "PREP");

	// The project exists either way; a failed invite can be retried from it.
	// Without an email or phone number there is no one to invite.
	let invite: "sent" | "failed" | "none" = "none";
	// By email when there is one, else texted to the phone number.
	const contact = booking.clientEmail ?? booking.clientPhone;
	if (contact) {
		const invited = await inviteToProject(
			{ id: photographerId, email: session.user.email },
			projectId,
			contact,
		);
		invite = invited.ok && invited.data.sent ? "sent" : "failed";
	}

	revalidatePath("/dashboard", "layout");
	revalidatePath("/portal", "layout");
	return ok({ projectId, invite });
}
