import "server-only";

import { db } from "@/lib/db";
import { DAY_MS } from "./constants";
import type { EventPayload } from "./schemas";

/** Real span of an event: all-day events cover their whole last day. */
export function eventSpan(event: EventPayload) {
	const start = new Date(event.startsAt);
	const end = new Date(Date.parse(event.endsAt) + (event.allDay ? DAY_MS : 0));
	return { start, end };
}

/** Prisma filter for stored events overlapping `[start, end)`. */
export function overlaps(start: Date, end: Date) {
	return {
		startsAt: { lt: end },
		OR: [
			{ allDay: false, endsAt: { gt: start } },
			{ allDay: true, endsAt: { gt: new Date(start.getTime() - DAY_MS) } },
		],
	};
}

/**
 * A day off and work can't share a day. Returns the error code to fail with,
 * or null when the event fits:
 * - `dayOff`: work planned on a day marked off;
 * - `dayNotFree`: a day marked off that already holds work.
 */
export async function dayOffClash(
	photographerId: string,
	event: EventPayload,
	excludeId = "",
): Promise<"dayOff" | "dayNotFree" | null> {
	if (event.type === "AVAILABLE") return null;
	const { start, end } = eventSpan(event);
	const base = {
		photographerId,
		id: { not: excludeId },
		...overlaps(start, end),
	};

	if (event.type !== "UNAVAILABLE") {
		const off = await db.calendarEvent.count({
			where: { ...base, type: "UNAVAILABLE" },
		});
		return off > 0 ? "dayOff" : null;
	}

	const [events, projects] = await Promise.all([
		db.calendarEvent.count({
			where: { ...base, type: { notIn: ["AVAILABLE", "UNAVAILABLE"] } },
		}),
		// Dated projects without events still show on the calendar.
		db.project.count({
			where: {
				photographerId,
				events: { none: {} },
				eventDate: { lt: end, gt: new Date(start.getTime() - DAY_MS) },
			},
		}),
	]);
	return events + projects > 0 ? "dayNotFree" : null;
}
