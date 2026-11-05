import "server-only";

import type { ChangeMark } from "@/components/shared/change-mark";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// "Unseen" for one side: something changed for them after they last opened it.
// The client also counts what they never opened; the studio only what the
// client did (a request they sent, an edit, an answer).

export const clientUnseenBooking = (): Prisma.BookingWhereInput => ({
	OR: [
		{ clientSeenAt: null },
		{ clientChangedAt: { gt: db.booking.fields.clientSeenAt } },
	],
});

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
