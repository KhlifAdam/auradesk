import "server-only";

import { z } from "zod";
import { devInboxEnabled, keepDevSms } from "./dev-inbox";

export interface SmsMessage {
	/** E.164, e.g. `+21620123456`. */
	to: string;
	body: string;
}

const twilioSchema = z.object({
	TWILIO_ACCOUNT_SID: z.string().min(1),
	TWILIO_AUTH_TOKEN: z.string().min(1),
	TWILIO_FROM: z.string().min(1),
});

/**
 * Sends a text message with the provider in `SMS_PROVIDER`:
 * - `console` (default): prints it in the server log and, in development,
 *   shows it in the on-screen "Test SMS" inbox;
 * - `twilio`: real SMS (needs the `TWILIO_*` variables).
 * Add another provider (a local gateway, WhatsApp) as a new branch here.
 */
export async function sendSms(message: SmsMessage) {
	const provider = process.env.SMS_PROVIDER ?? "console";

	if (provider === "twilio") return sendWithTwilio(message);
	if (provider !== "console")
		throw new Error(`Unknown SMS_PROVIDER "${provider}"`);

	console.info(`[sms → ${message.to}] ${message.body}`);
	if (devInboxEnabled()) keepDevSms(message.to, message.body);
}

async function sendWithTwilio({ to, body }: SmsMessage) {
	const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } =
		twilioSchema.parse(process.env);
	const response = await fetch(
		`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
		{
			method: "POST",
			headers: {
				Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
		},
	);
	if (!response.ok)
		throw new Error(`Twilio rejected the message (${response.status})`);
}
