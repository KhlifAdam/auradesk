import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { mailCopy } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** To the client, when the photographer issues an invoice to their account. */
export async function sendInvoiceEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	number: string;
	amount: string;
	invoiceId: string;
}) {
	const { to, locale, invoiceId, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).invoiceSent,
			locale,
			vars,
			appUrl(`/portal/invoices/${invoiceId}`),
		),
	});
}
