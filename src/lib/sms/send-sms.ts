import "server-only";

import { z } from "zod";
import {
	cloudConfigured,
	sendCloudTemplate,
} from "@/lib/whatsapp/cloud/cloud-client";
import { markGatewayUnreachable } from "@/lib/whatsapp/connection-status";
import { sendWhatsappText } from "@/lib/whatsapp/gateway-client";
import { routeFor } from "@/lib/whatsapp/routing";
import { type SmsKey, smsText } from "./sms-copy";

export interface SmsMessage {
	/** E.164, e.g. `+21620123456`. */
	to: string;
	/** Which message: picks the text, and the WhatsApp channel and template. */
	kind: SmsKey;
	locale: string | null | undefined;
	vars: Record<string, string>;
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
 * - `whatsapp`: over WhatsApp, through the channel the admin chose for this
 *   kind of message: the linked number (wa-gateway) or the official Cloud
 *   API. When it can't deliver, `SMS_FALLBACK_PROVIDER` (`console` by
 *   default) sends it instead, so codes still arrive.
 */
export async function sendSms(message: SmsMessage) {
	const provider = process.env.SMS_PROVIDER ?? "console";
	if (provider === "whatsapp") return sendWithWhatsapp(message);
	if (provider === "console" || provider === "twilio")
		return sendWithProvider(provider, message);
	throw new Error(`Unknown SMS_PROVIDER "${provider}"`);
}

async function sendWithWhatsapp(message: SmsMessage) {
	const sent =
		(await routeFor(message.kind)) === "CLOUD"
			? await sendWithCloud(message)
			: await sendWithGateway(message);
	if (!sent) return sendWithProvider(fallbackProvider(), message);
}

async function sendWithCloud({ to, kind, locale, vars }: SmsMessage) {
	if (!cloudConfigured()) return false;
	try {
		return (await sendCloudTemplate(to, kind, locale, vars)) === "sent";
	} catch (error) {
		console.error("WhatsApp Cloud API unreachable:", error);
		return false;
	}
}

async function sendWithGateway(message: SmsMessage) {
	try {
		// Not connected (the gateway reports that itself) or no WhatsApp account.
		return (await sendWhatsappText(message.to, textOf(message))) === "sent";
	} catch (error) {
		// A dead gateway can't report itself: record it here.
		console.error("WhatsApp gateway unreachable:", error);
		await markGatewayUnreachable().catch((failure) =>
			console.error("Failed to record the WhatsApp status:", failure),
		);
		return false;
	}
}

function fallbackProvider(): TextProvider {
	return process.env.SMS_FALLBACK_PROVIDER === "twilio" ? "twilio" : "console";
}

function sendWithProvider(provider: TextProvider, message: SmsMessage) {
	const body = textOf(message);
	if (provider === "twilio") return sendWithTwilio(message.to, body);
	console.info(`[sms → ${message.to}] ${body}`);
}

const textOf = ({ kind, locale, vars }: SmsMessage) =>
	smsText(locale, kind, vars);

async function sendWithTwilio(to: string, body: string) {
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
