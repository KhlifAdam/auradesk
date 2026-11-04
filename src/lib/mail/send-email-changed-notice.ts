import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { mailCopy } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

/** To the old address once the email changed, in case it wasn't the owner. */
export async function sendEmailChangedNotice(props: {
	to: string;
	locale: Locale;
	newEmail: string;
}) {
	const { to, locale, newEmail } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).emailChanged,
			locale,
			{ email: newEmail },
			`${env.BETTER_AUTH_URL.replace(/\/$/, "")}/forgot-password`,
		),
	});
}
