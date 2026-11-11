import "server-only";

import type { ChangeMark } from "@/components/shared/change-mark";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
	type BookingStatus,
	isOpenStatus,
	OPEN_STATUSES,
} from "@/services/bookings/options";

// "Unseen" for one side: something changed for them after they last opened it.
// The client also counts what they never opened; the studio only what the
// client did (a request they sent, an edit, an answer).

/**
 * A booking only calls for the client while it is open: "new" when the studio
 * sent it and they haven't answered or opened it, "updated" when the studio
 * changed it since they last looked. Confirmed and declined ones never do.
 */
export const clientUnseenBooking = (): Prisma.BookingWhereInput => ({
	status: { in: [...OPEN_STATUSES] },
	OR: [
		{
			clientSeenAt: null,
			sentToClientAt: { not: null },
			clientAcceptedAt: null,
		},
		{ clientChangedAt: { gt: db.booking.fields.clientSeenAt } },
	],
});

/** The card mark matching `clientUnseenBooking`. */
export function clientBookingMark(row: {
	status: BookingStatus;
	clientSeenAt: Date | null;
	clientChangedAt: Date | null;
	sentToClientAt: Date | null;
	clientAcceptedAt: Date | null;
}): ChangeMark {
	if (!isOpenStatus(row.status)) return null;
	const mark = changeMark(row.clientSeenAt, row.clientChangedAt);
	if (mark !== "new") return mark;
	return row.sentToClientAt && !row.clientAcceptedAt ? "new" : null;
}

export const clientUnseenProject = (): Prisma.ProjectWhereInput => ({
	OR: [
		{ clientSeenAt: null },
		{ clientChangedAt: { gt: db.project.fields.clientSeenAt } },
	],
});

export const studioUnseenBooking = (): Prisma.BookingWhereInput => ({
	studioChangedAt: { not: null },
	OR: [
		{ studioSeenAt: null },
		{ studioChangedAt: { gt: db.booking.fields.studioSeenAt } },
	],
});

export const studioUnseenProject = (): Prisma.ProjectWhereInput => ({
	studioChangedAt: { not: null },
	OR: [
		{ studioSeenAt: null },
		{ studioChangedAt: { gt: db.project.fields.studioSeenAt } },
	],
});

/** "new" never opened, "updated" changed since last opened, else nothing. */
export function changeMark(
	seenAt: Date | null,
	changedAt: Date | null,
	/** The studio's side: only what the client did counts. */
	onlyChanges = false,
): ChangeMark {
	if (seenAt === null) return onlyChanges && changedAt === null ? null : "new";
	return changedAt && changedAt > seenAt ? "updated" : null;
}
