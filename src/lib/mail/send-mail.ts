import { isPhoneEmail } from "@/lib/phone";
import { LOGO_CID } from "./templates/base-layout";
import { LOGO_PNG_BASE64 } from "./templates/logo";
import { getTransporter } from "./transporter";

export type MailMessage = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

export async function sendMail(message: MailMessage) {
	// Phone-only accounts have a placeholder address that can't receive mail.
	if (isPhoneEmail(message.to)) return;
	await getTransporter().sendMail({
		from: process.env.SMTP_FROM,
		...message,
		// Embedded rather than linked, so the logo shows without loading remote images.
		attachments: [
			{
				filename: "auradesk.png",
				content: LOGO_PNG_BASE64,
				encoding: "base64",
				cid: LOGO_CID,
				contentDisposition: "inline",
			},
		],
	});
}
