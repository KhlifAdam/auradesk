import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { mailCopy } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** To the photographer, when a client sends a photo book to be printed. */
export async function sendBookOrderEmail(props: {
	to: string;
	locale: Locale;
	client: string;
	book: string;
	project: string;
	pages: number;
	copies: number;
	total: string;
	bookId: string;
}) {
	const { to, locale, bookId, pages, copies, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).bookOrderSubmitted,
			locale,
			{ ...vars, pages: String(pages), copies: String(copies) },
			appUrl(`/dashboard/books/${bookId}`),
		),
	});
}

/** To the client, when the studio sends the book back with a note. */
export async function sendBookSentBackEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	book: string;
	note: string;
	bookId: string;
}) {
	const { to, locale, bookId, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).bookSentBack,
			locale,
			{ ...vars, note: vars.note || "—" },
			appUrl(`/portal/books/${bookId}`),
		),
	});
}

/** To the client, when their printed book is ready. */
export async function sendBookReadyEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	book: string;
	bookId: string;
}) {
	const { to, locale, bookId, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).bookReady,
			locale,
			vars,
			appUrl(`/portal/books/${bookId}`),
		),
	});
}
