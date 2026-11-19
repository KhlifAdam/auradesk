import { z } from "zod";
import {
	detectCardBrand,
	isPossibleCardStart,
	maxCardLength,
} from "./card-brands";

/** The card the fake gateway's "bank" always declines. */
export const DECLINED_TEST_CARD = "4000000000000002";

export type CardMethod = "bankCard" | "eDinar";

export const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** The Luhn checksum every real card number passes. */
export function passesLuhn(number: string) {
	let sum = 0;
	let double = false;
	for (let i = number.length - 1; i >= 0; i--) {
		let digit = Number(number[i]);
		if (double) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
		double = !double;
	}
	return number.length > 0 && sum % 10 === 0;
}

/** MMYY (digits only), valid through the end of that month. */
export function isFutureExpiry(mmyy: string, now = new Date()) {
	if (!/^\d{4}$/.test(mmyy)) return false;
	const month = Number(mmyy.slice(0, 2));
	const year = 2000 + Number(mmyy.slice(2));
	if (month < 1 || month > 12 || year > now.getFullYear() + 20) return false;
	return new Date(year, month, 1) > now;
}

/*
 * Typing rules: each field keeps only what could still become valid, so a
 * keystroke that can't (a letter, a 13th month, a card no network issues)
 * is simply not taken. Deleting is always allowed.
 */

const isDeletion = (digits: string, previous: string) =>
	digits.length < previous.length;

/** Letters, spaces, apostrophes, dots and hyphens; one space at a time. */
export const cleanName = (raw: string, max = 60) =>
	raw
		.replace(/[^\p{L}\s'.-]/gu, "")
		.replace(/^\s+/, "")
		.replace(/\s{2,}/g, " ")
		.slice(0, max);

/** Tunisian numbers: 8 digits, starting the way operators allocate them. */
const PHONE_START = /^[2345679]/;

export function typePhone(raw: string, previous: string) {
	const digits = digitsOnly(raw).slice(0, 8);
	if (isDeletion(digits, previous)) return digits;
	return digits && !PHONE_START.test(digits) ? previous : digits;
}

/** Card digits, up to the network's length; E-Dinar cards have 16. */
export function typeCardNumber(
	raw: string,
	previous: string,
	method: CardMethod,
) {
	const digits = digitsOnly(raw);
	if (isDeletion(digits, previous)) return digits;
	if (!isPossibleCardStart(digits)) return previous;
	const max = method === "eDinar" ? 16 : maxCardLength(detectCardBrand(digits));
	return digits.slice(0, max);
}

/** MMYY digits: "4" becomes "04", no month 00 or 13, no year long gone. */
export function typeExpiry(raw: string, previous: string, now = new Date()) {
	let digits = digitsOnly(raw);
	if (isDeletion(digits, previous)) return digits;
	if (/^[2-9]/.test(digits)) digits = `0${digits}`;
	digits = digits.slice(0, 4);
	if (digits.length >= 2) {
		const month = Number(digits.slice(0, 2));
		if (month < 1 || month > 12) return previous;
	}
	const year = now.getFullYear() % 100;
	if (digits.length === 3) {
		const tens = Number(digits[2]);
		if (tens < Math.floor(year / 10) || tens > Math.floor((year + 20) / 10))
			return previous;
	}
	if (digits.length === 4) {
		const yy = Number(digits.slice(2));
		if (yy < year || yy > year + 20) return previous;
	}
	return digits;
}

/** "12 / 30" while typing "1230". */
export const formatExpiry = (digits: string) =>
	digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;

/** The CVV's length for the card typed so far (4 on American Express). */
export const cvvLengthFor = (number: string) =>
	detectCardBrand(number)?.cvvLength ?? 3;

/** The name as embossed: capitals, 26 characters at most. */
export const cleanHolder = (raw: string) => cleanName(raw, 26).toUpperCase();

/** The contact step of the checkout. Messages are `Validation` keys. */
export const contactSchema = z.object({
	firstName: z.string().trim().min(1, "required").max(60, "tooLong"),
	lastName: z.string().trim().min(1, "required").max(60, "tooLong"),
	/** Tunisian number, 8 digits after +216. */
	phone: z.string().regex(/^[2345679]\d{7}$/, "invalidPhone"),
	email: z.string().trim().min(1, "required").pipe(z.email("invalidEmail")),
});

export type ContactValues = z.infer<typeof contactSchema>;

/** Whether a whole card number is one a network issues. */
export function isValidCardNumber(number: string, method: CardMethod) {
	const brand = detectCardBrand(number);
	if (!brand?.lengths.includes(number.length)) return false;
	if (method === "eDinar" && number.length !== 16) return false;
	return passesLuhn(number);
}

/**
 * The card form (digits only, formatted for display). Checked in the
 * browser: card details never leave it.
 */
export const cardSchema = (method: CardMethod) =>
	z
		.object({
			number: z.string(),
			expiry: z.string(),
			cvv: z.string(),
			holder: z.string(),
		})
		.superRefine((card, ctx) => {
			const fail = (path: keyof typeof card, message: string) =>
				ctx.addIssue({ code: "custom", path: [path], message });
			if (!isValidCardNumber(card.number, method)) fail("number", "cardNumber");
			if (!isFutureExpiry(card.expiry)) fail("expiry", "cardExpiry");
			const cvv = card.cvv;
			if (cvv.length !== cvvLengthFor(card.number) || digitsOnly(cvv) !== cvv)
				fail("cvv", "cardCvv");
			const holder = card.holder.trim();
			if (holder.length < 2 || holder.length > 26) fail("holder", "cardHolder");
		});

export type CardValues = z.infer<ReturnType<typeof cardSchema>>;
