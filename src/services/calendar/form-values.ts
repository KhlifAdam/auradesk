import { allDayIso, dayKeyIn, timeIn, zonedToIso } from "./dates";
import type { EventFormValues, EventPayload } from "./schemas";
import type { CalendarEntry } from "./types";

const DEFAULT_START = "09:00";
const DEFAULT_END = "10:00";

/** Empty form for a new event on `day`. */
export function newEventValues(
	day: string,
	type: EventFormValues["type"] = "SHOOT",
): EventFormValues {
	return {
		type,
		title: "",
		allDay: type === "AVAILABLE" || type === "UNAVAILABLE",
		startDate: day,
		startTime: DEFAULT_START,
		endDate: day,
		endTime: DEFAULT_END,
		location: "",
		projectId: "",
		notes: "",
	};
}

export function entryToValues(
	entry: CalendarEntry,
	timeZone: string,
): EventFormValues {
	const base = {
		type:
			entry.type === "PROJECT" || entry.type === "ESTIMATE"
				? "SHOOT"
				: entry.type,
		title: entry.title,
		allDay: entry.allDay,
		location: entry.location,
		projectId: entry.projectId ?? "",
		notes: entry.notes,
	} as const;
	if (entry.allDay) {
		return {
			...base,
			startDate: entry.startsAt.slice(0, 10),
			endDate: entry.endsAt.slice(0, 10),
			startTime: DEFAULT_START,
			endTime: DEFAULT_END,
		};
	}
	return {
		...base,
		startDate: dayKeyIn(entry.startsAt, timeZone),
		startTime: timeIn(entry.startsAt, timeZone),
		endDate: dayKeyIn(entry.endsAt, timeZone),
		endTime: timeIn(entry.endsAt, timeZone),
	};
}

export function valuesToPayload(
	{ startDate, startTime, endDate, endTime, ...values }: EventFormValues,
	timeZone: string,
): EventPayload {
	return {
		...values,
		startsAt: values.allDay
			? allDayIso(startDate)
			: zonedToIso(startDate, startTime, timeZone),
		endsAt: values.allDay
			? allDayIso(endDate)
			: zonedToIso(endDate, endTime, timeZone),
	};
}
