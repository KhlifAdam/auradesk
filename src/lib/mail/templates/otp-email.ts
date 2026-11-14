import type { Locale } from "@/i18n/config";
import type { MailMessage } from "../send-mail";
import { baseLayout, mailColors as c, MAIL_DISPLAY_FONT } from "./base-layout";

export interface OtpCopy {
	subject: string;
	preheader: string;
	heading: string;
	intro: string;
	expires: string;
	ignore: string;
	text: string;
}

/** One box per digit, like the code input in the app. */
function codeBoxes(otp: string) {
	const cells = [...otp]
		.map(
			(digit) =>
				`<td style="padding:0 3px;"><div style="width:40px;height:54px;line-height:54px;text-align:center;font-family:${MAIL_DISPLAY_FONT};font-size:26px;font-weight:700;color:${c.accent};background:${c.inset};border:1px solid ${c.border};border-radius:12px;">${digit}</div></td>`,
		)
		.join("");
	return `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 28px;"><tr>${cells}</tr></table>`;
}

/** A one-time code email in the recipient's language. */
export function otpEmail(
	copy: OtpCopy,
	locale: Locale,
	otp: string,
	expiresInMinutes: number,
): Pick<MailMessage, "subject" | "text" | "html"> {
	return {
		subject: copy.subject,
		text: copy.text
			.replace("{otp}", otp)
			.replace("{minutes}", String(expiresInMinutes)),
		html: baseLayout({
			locale,
			preheader: copy.preheader.replace("{otp}", otp),
			content: `
			<h1 style="margin:0 0 12px;font-family:${MAIL_DISPLAY_FONT};font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.4px;color:${c.text};text-align:center;">${copy.heading}</h1>
			<p style="margin:0 0 32px;font-size:15px;line-height:24px;color:${c.muted};text-align:center;">${copy.intro}</p>
			${codeBoxes(otp)}
			<p style="margin:0 0 28px;font-size:14px;line-height:22px;color:${c.text};text-align:center;">${copy.expires.replace("{minutes}", `<strong style="color:${c.accent};">${expiresInMinutes}</strong>`)}</p>
			<div style="height:1px;line-height:1px;font-size:0;background:${c.border};margin:0 0 20px;">&nbsp;</div>
			<p style="margin:0;font-size:13px;line-height:20px;color:${c.subtle};text-align:center;">${copy.ignore}</p>`,
		}),
	};
}
