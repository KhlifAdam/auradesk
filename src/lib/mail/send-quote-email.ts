import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { mailCopy } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** To the client, when the photographer sends them a quote to accept or decline. */
export async function sendQuoteEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	number: string;
	amount: string;
	quoteId: string;
}) {
	const { to, locale, quoteId, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).quoteSent,
			locale,
			vars,
			appUrl(`/portal/invoices/quotes/${quoteId}`),
		),
	});
}
