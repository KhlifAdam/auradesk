import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/** Numbers typed without a country code are read as Tunisian. */
export const DEFAULT_COUNTRY = "TN";

/**
 * Any way of typing a number (`20 123 456`, `+216 20-123-456`, `0021620123456`)
 * becomes E.164 (`+21620123456`); null when it isn't a valid number.
 */
export function toE164(raw: string): string | null {
	const input = raw.trim();
	if (!input) return null;
	const normalized = input.startsWith("00") ? `+${input.slice(2)}` : input;
	const parsed = parsePhoneNumberFromString(normalized, DEFAULT_COUNTRY);
	return parsed?.isValid() ? parsed.number : null;
}

/** `+21620123456` → `+216 20 123 456`, for display. */
export function formatPhone(e164: string): string {
	return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

// Accounts created from a phone number have no real email: Better Auth needs
// one, so they get an address that can never receive mail (`.invalid`).
// Keeps the app's former name: phone-only accounts already store addresses
// under it, and they are never shown. Changing it would break those accounts.
const PHONE_EMAIL_DOMAIN = "phone.lumodesk.invalid";

export const phoneEmail = (e164: string) =>
	`${e164.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`;

/** True for the placeholder address of a phone-only account. */
export const isPhoneEmail = (email: string) =>
	email.toLowerCase().endsWith(`@${PHONE_EMAIL_DOMAIN}`);

/** The email to show or send to: null for phone-only accounts. */
export const realEmail = (email: string) =>
	isPhoneEmail(email) ? null : email;
