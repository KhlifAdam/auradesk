import type { Locale } from "@/i18n/config";
import { BRAND_NAME } from "@/lib/brand";
import { mailCopy } from "../mail-copy";

/** The app's dark theme (globals.css `.dark`), as hex for mail clients. */
export const mailColors = {
	page: "#03050b",
	card: "#080d18",
	inset: "#0e1422",
	border: "#1f2532",
	text: "#f8fafc",
	muted: "#90a1b9",
	subtle: "#5d6b82",
	accent: "#daa843",
	accentText: "#140b03",
} as const;

/** Content id of the inline logo attached by `sendMail`. */
export const LOGO_CID = "logo@auradesk";

export const MAIL_FONT = "'DM Sans','Segoe UI',Helvetica,Arial,sans-serif";
export const MAIL_DISPLAY_FONT =
	"Manrope,'DM Sans','Segoe UI',Helvetica,Arial,sans-serif";

const FONTS_URL =
	"https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap";

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
	<meta name="supported-color-schemes" content="dark" />
	<link href="${FONTS_URL}" rel="stylesheet" />
	<title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${c.page};font-family:${MAIL_FONT};-webkit-font-smoothing:antialiased;">
	<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${c.page};">
		<tr><td align="center" style="padding:44px 16px 40px;">
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
				<tr><td align="center" style="padding-bottom:28px;">
					<table role="presentation" cellspacing="0" cellpadding="0"><tr>
						<td style="vertical-align:middle;"><img src="cid:${LOGO_CID}" width="40" height="40" alt="" style="display:block;width:40px;height:40px;border:0;border-radius:12px;" /></td>
						<td style="vertical-align:middle;padding-left:12px;font-family:${MAIL_DISPLAY_FONT};font-size:22px;line-height:28px;font-weight:700;letter-spacing:-0.3px;color:${c.text};">${BRAND_NAME}</td>
					</tr></table>
				</td></tr>
				<tr><td style="background:${c.card};border:1px solid ${c.border};border-radius:20px;padding:36px 28px;">
					<div style="width:40px;height:3px;line-height:3px;font-size:0;margin:0 auto 24px;border-radius:3px;background:${c.accent};">&nbsp;</div>
					${content}
				</td></tr>
				<tr><td align="center" style="padding:28px 24px 0;font-size:12px;line-height:19px;color:${c.subtle};">
					${footer.reason}<br />
					&copy; ${new Date().getFullYear()} ${BRAND_NAME}. ${footer.rights}
				</td></tr>
			</table>
		</td></tr>
	</table>
</body>
</html>`;
}
