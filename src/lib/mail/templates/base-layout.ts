import type { Locale } from "@/i18n/config";
import { mailCopy } from "../mail-copy";

export const mailColors = {
	page: "#0b0d17",
	card: "#14172a",
	border: "#262a44",
	text: "#f4f5fa",
	muted: "#9aa0bd",
	accent: "#e0ae45",
	accentText: "#1a1405",
} as const;

const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

type BaseLayoutProps = {
	locale: Locale;
	preheader: string;
	content: string;
};

/** Table-based, inline-styled layout so it renders in every email client. */
export function baseLayout({ locale, preheader, content }: BaseLayoutProps) {
	const c = mailColors;
	const footer = mailCopy(locale).footer;
	return `<!doctype html>
<html lang="${locale}">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<meta name="color-scheme" content="dark" />
	<title>AuraDesk</title>
</head>
<body style="margin:0;padding:0;background:${c.page};font-family:${FONT};">
	<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${c.page};">
		<tr><td align="center" style="padding:40px 16px;">
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;">
				<tr><td align="center" style="padding-bottom:24px;">
					<span style="display:inline-block;width:36px;height:36px;line-height:36px;border-radius:10px;background:${c.accent};color:${c.accentText};font-size:18px;font-weight:700;text-align:center;vertical-align:middle;">A</span>
					<span style="display:inline-block;margin-left:10px;vertical-align:middle;font-size:20px;font-weight:600;letter-spacing:.3px;color:${c.text};">AuraDesk</span>
				</td></tr>
				<tr><td style="background:${c.card};border:1px solid ${c.border};border-radius:16px;padding:36px 32px;">
					${content}
				</td></tr>
				<tr><td align="center" style="padding:24px 16px 0;font-size:12px;line-height:18px;color:${c.muted};">
					${footer.reason}<br />
					&copy; ${new Date().getFullYear()} AuraDesk. ${footer.rights}
				</td></tr>
			</table>
		</td></tr>
	</table>
</body>
</html>`;
}
