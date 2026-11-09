/** Mirrors the `calendar_event_type` enum. */
export const EVENT_TYPES = [
	"SHOOT",
	"MEETING",
	"AVAILABLE",
	"UNAVAILABLE",
	"OTHER",
] as const;

export type CalendarEventType = (typeof EVENT_TYPES)[number];

/** Types that occupy the photographer; two of them overlapping is a conflict. */
export const BUSY_TYPES = [
	"SHOOT",
	"MEETING",
	"UNAVAILABLE",
] as const satisfies CalendarEventType[];

/** Types that can belong to a project; the others never link to one. */
export const PROJECT_TYPES = [
	"SHOOT",
	"MEETING",
] as const satisfies CalendarEventType[];

export const canLinkProject = (type: CalendarEventType) =>
	(PROJECT_TYPES as readonly CalendarEventType[]).includes(type);

/** Longest event span, in days. */
export const MAX_EVENT_DAYS = 366;

export const DAY_MS = 24 * 60 * 60 * 1000;
