import type { CalendarEventType } from "./constants";

/**
 * One item on the calendar: an event, or a project's date (read-only,
 * shown for projects that have no linked event yet), or the day a project
 * should be finished (read-only, from the smart estimate).
 * All-day items carry UTC midnights of their first and last day.
 */
export interface CalendarEntry {
	id: string;
	kind: "event" | "project" | "estimate";
	type: CalendarEventType | "PROJECT" | "ESTIMATE";
	title: string;
	allDay: boolean;
	startsAt: string;
	endsAt: string;
	location: string;
	notes: string;
	projectId: string | null;
	projectTitle: string | null;
}

export interface ProjectOption {
	id: string;
	title: string;
}
