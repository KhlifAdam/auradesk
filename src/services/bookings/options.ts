// Mirrors the Prisma enums.

export const BOOKING_STATUSES = [
	"NEW",
	"DISCUSSION",
	"QUOTE_SENT",
	"CONFIRMED",
	"DECLINED",
] as const;

export const BOOKING_SOURCES = [
	"INSTAGRAM",
	"WHATSAPP",
	"PHONE",
	"WEBSITE",
	"OTHER",
	"PORTAL",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingSource = (typeof BOOKING_SOURCES)[number];

/** Statuses of a request that is still being worked on. */
export const OPEN_STATUSES = [
	"NEW",
	"DISCUSSION",
	"QUOTE_SENT",
] as const satisfies BookingStatus[];

export type OpenStatus = (typeof OPEN_STATUSES)[number];

export const isOpenStatus = (status: BookingStatus): status is OpenStatus =>
	(OPEN_STATUSES as readonly string[]).includes(status);

/**
 * Body of the status activity of a booking confirmed before the client
 * accepted it (a phone or walk-in client, say): the history says so.
 */
export const CONFIRMED_WITHOUT_CLIENT = "withoutClient";
