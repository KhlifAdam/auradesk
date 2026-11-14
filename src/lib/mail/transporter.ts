import nodemailer, { type Transporter } from "nodemailer";
import { z } from "zod";

const smtpEnv = z.object({
	SMTP_HOST: z.string().min(1),
	SMTP_PORT: z.coerce.number().int().positive(),
	SMTP_USER: z.string().min(1),
	SMTP_PASSWORD: z.string().min(1),
	SMTP_FROM: z.string().min(1),
	DKIM_SELECTOR: z.string().optional(),
	DKIM_PRIVATE_KEY: z.string().optional(),
});

let transporter: Transporter | undefined;

/** Domain of the sender address, e.g. "auradesk.tn" from "AuraDesk <contact@auradesk.tn>". */
function senderDomain(from: string) {
	const domain = from.match(/@([^>\s]+)/)?.[1];
	if (!domain) throw new Error("SMTP_FROM must contain an email address");
	return domain.toLowerCase();
}

export function getTransporter() {
	if (!transporter) {
		const env = smtpEnv.parse(process.env);
		const domain = senderDomain(env.SMTP_FROM);
		transporter = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port: env.SMTP_PORT,
			secure: env.SMTP_PORT === 465,
			auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
			// Greet the server with our domain, not the machine's hostname,
			// which spam filters read as a sign of a misconfigured sender.
			name: domain,
			// Sign every message so receivers can verify it really comes from us.
			...(env.DKIM_SELECTOR && env.DKIM_PRIVATE_KEY
				? {
						dkim: {
							domainName: domain,
							keySelector: env.DKIM_SELECTOR,
							privateKey: env.DKIM_PRIVATE_KEY.replace(/\\n/g, "\n"),
						},
					}
				: {}),
		});
	}
	return transporter;
}
