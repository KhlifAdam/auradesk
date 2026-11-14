import type { Locale } from "@/i18n/config";
import type { MailMessage } from "../send-mail";
import { baseLayout, mailColors as c, MAIL_DISPLAY_FONT } from "./base-layout";

export interface NoticeCopy {
	subject: string;
	preheader: string;
	heading: string;
	intro: string;
	cta: string;
	text: string;
}

function escapeHtml(value: string) {
	return value.replace(
		/[&<>"']/g,
		(ch) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				ch
			] as string,
	);
}

function fill(template: string, vars: Record<string, string>, html: boolean) {
	return template.replace(/\{(\w+)\}/g, (match, name: string) => {
		const value = vars[name];
		if (value === undefined) return match;
		return html ? escapeHtml(value) : value;
	});
}

/** Short notification with one call to action, in the recipient's language. */
export function noticeEmail(
	copy: NoticeCopy,
	locale: Locale,
	vars: Record<string, string>,
	url: string,
): Pick<MailMessage, "subject" | "text" | "html"> {
	return {
		subject: fill(copy.subject, vars, false),
		text: fill(copy.text, { ...vars, url }, false),
		html: baseLayout({
			locale,
			preheader: fill(copy.preheader, vars, true),
			content: `
			<h1 style="margin:0 0 12px;font-family:${MAIL_DISPLAY_FONT};font-size:23px;line-height:31px;font-weight:700;letter-spacing:-0.4px;color:${c.text};text-align:center;">${fill(copy.heading, vars, true)}</h1>
			<p style="margin:0 0 30px;font-size:15px;line-height:24px;color:${c.muted};text-align:center;">${fill(copy.intro, vars, true)}</p>
			<p style="margin:0;text-align:center;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 26px;border-radius:12px;background:${c.accent};color:${c.accentText};font-family:${MAIL_DISPLAY_FONT};font-size:14px;font-weight:700;text-decoration:none;">${copy.cta}&nbsp;&rarr;</a></p>`,
		}),
	};
}
