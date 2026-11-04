import "server-only";

import { z } from "zod";
import { markGatewayUnreachable } from "@/lib/whatsapp/connection-status";
import { sendWhatsappText } from "@/lib/whatsapp/gateway-client";

export interface SmsMessage {
	/** E.164, e.g. `+21620123456`. */
	to: string;
	body: string;
}

type TextProvider = "console" | "twilio";

const twilioSchema = z.object({
	TWILIO_ACCOUNT_SID: z.string().min(1),
	TWILIO_AUTH_TOKEN: z.string().min(1),
	TWILIO_FROM: z.string().min(1),
});

/**
 * Sends a text message with the provider in `SMS_PROVIDER`:
 * - `console` (default): prints it in the server log;
 * - `twilio`: real SMS (needs the `TWILIO_*` variables);
 * - `whatsapp`: a WhatsApp message from the number the admin linked
 *   (wa-gateway). When WhatsApp can't deliver it, `SMS_FALLBACK_PROVIDER`
 *   (`console` by default) sends it instead, so codes still arrive.
 */
export async function sendSms(message: SmsMessage) {
	const provider = process.env.SMS_PROVIDER ?? "console";
	if (provider === "whatsapp") return sendWithWhatsapp(message);
	if (provider === "console" || provider === "twilio")
		return sendWithProvider(provider, message);
	throw new Error(`Unknown SMS_PROVIDER "${provider}"`);
}

async function sendWithWhatsapp(message: SmsMessage) {
	try {
		// Not connected (the gateway reports that itself) or no WhatsApp account.
		if ((await sendWhatsappText(message.to, message.body)) === "sent") return;
	} catch (error) {
		// A dead gateway can't report itself: record it here.
		console.error("WhatsApp gateway unreachable:", error);
		await markGatewayUnreachable().catch((failure) =>
			console.error("Failed to record the WhatsApp status:", failure),
		);
	}
	return sendWithProvider(fallbackProvider(), message);
}

function fallbackProvider(): TextProvider {
	return process.env.SMS_FALLBACK_PROVIDER === "twilio" ? "twilio" : "console";
}

function sendWithProvider(provider: TextProvider, message: SmsMessage) {
	if (provider === "twilio") return sendWithTwilio(message);
	console.info(`[sms → ${message.to}] ${message.body}`);
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
