import { z } from "zod";

// Messages are `Validation.*` i18n keys (translated by <FormMessage />).

export const requiredText = (max: number) =>
	z.string().trim().min(1, "required").max(max, "tooLong");

export const optionalText = (max: number) =>
	z.string().trim().max(max, "tooLong");

export const optionalUrl = z
	.string()
	.trim()
	.max(300, "tooLong")
	.refine((v) => v === "" || z.url().safeParse(v).success, "invalidUrl");

export const optionalEmail = z
	.string()
	.trim()
	.refine((v) => v === "" || z.email().safeParse(v).success, "invalidEmail");

export const slugSchema = z
	.string()
	.trim()
	.min(3, "slugTooShort")
	.max(48, "tooLong")
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalidSlug");

export const idSchema = z.string().min(1);

/** Empty string → null, for optional DB columns. */
export const emptyToNull = (value: string | undefined) => value || null;

const MAX_AMOUNT = 99_999_999;

/** `<input type="date">` value, or empty. */
export const dateInput = z
	.string()
	.trim()
	.refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "invalidDate");

/** How far back a booking may be dated; projects have no such limit (archives). */
export const BOOKING_PAST_DAYS = 5;

/** A `yyyy-MM-dd` date more than 5 days back; an empty one never is. */
export function isTooEarly(value: string) {
	if (value === "") return false;
	const earliest = new Date(Date.now() - BOOKING_PAST_DAYS * 86_400_000);
	return value < earliest.toISOString().slice(0, 10);
}

/** A date input for a new booking: empty, or no earlier than 5 days ago. */
export const upcomingDateInput = dateInput.refine(
	(v) => !isTooEarly(v),
	"dateTooEarly",
);

/**
 * The same, when editing: the date already stored is kept as it is, even once
 * it is in the past, so it never blocks saving the other fields.
 */
export const keptOrUpcomingDate = (kept: string) =>
	dateInput.refine((v) => v === kept || !isTooEarly(v), "dateTooEarly");

/** `<input type="time">` value, or empty. */
export const timeInput = z
	.string()
	.refine(
		(v) => v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
		"invalidTime",
	);

/** Money in TND; an empty number input is `null`. */
export const moneyAmount = z
	.number("invalidAmount")
	.min(0, "invalidAmount")
	.max(MAX_AMOUNT, "invalidAmount")
	.nullable();
