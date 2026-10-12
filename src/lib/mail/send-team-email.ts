import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { mailCopy } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** To a collaborator invited to a studio's team; new addresses go to sign-up. */
export async function sendTeamInvitationEmail(props: {
	to: string;
	locale: Locale;
	studio: string;
	name: string;
	hasAccount: boolean;
}) {
	const { to, locale, hasAccount, ...vars } = props;
	await sendMail({
		to,
		...noticeEmail(
			mailCopy(locale).teamInvitation,
			locale,
			vars,
			appUrl(hasAccount ? "/team" : "/register"),
		),
	});
}
