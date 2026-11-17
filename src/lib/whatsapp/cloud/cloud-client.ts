import "server-only";

import { z } from "zod";
import { toLocale } from "@/i18n/config";
import { env } from "@/lib/env";
import type { SmsKey } from "@/lib/sms/sms-copy";
import type { SendOutcome } from "../gateway-client";
import { CLOUD_TEMPLATES, type CloudTemplate } from "./cloud-templates";

const cloudSchema = z.object({
	WHATSAPP_CLOUD_TOKEN: z.string().min(1),
	WHATSAPP_CLOUD_PHONE_NUMBER_ID: z.string().min(1),
	// Empty in .env means unset.
	WHATSAPP_CLOUD_API_VERSION: z
		.string()
		.optional()
		.transform((version) => version || "v23.0"),
});

/** Every kind has a template: the compiler checks none is missing. */
const TEMPLATES: Record<SmsKey, CloudTemplate> = CLOUD_TEMPLATES;

/** Meta's "this recipient has no WhatsApp account" error. */
const NOT_ON_WHATSAPP = 131026;

/** True when the app can call Meta's WhatsApp Cloud API. */
export function cloudConfigured() {
	return cloudSchema.safeParse(process.env).success;
}

/** Calls the Graph API for the configured number. Throws when Meta can't be reached. */
async function call(path: string, init?: RequestInit) {
	const config = cloudSchema.parse(process.env);
	return fetch(
		`https://graph.facebook.com/${config.WHATSAPP_CLOUD_API_VERSION}/${config.WHATSAPP_CLOUD_PHONE_NUMBER_ID}${path}`,
		{
			...init,
			headers: {
				Authorization: `Bearer ${config.WHATSAPP_CLOUD_TOKEN}`,
				"Content-Type": "application/json",
			},
			signal: AbortSignal.timeout(10_000),
			cache: "no-store",
		},
	);
}

const senderSchema = z.object({
	display_phone_number: z.string(),
	verified_name: z.string(),
	quality_rating: z.string().optional(),
});

export type CloudSender = z.infer<typeof senderSchema>;

/** The number messages go out from, as Meta knows it. */
export async function getCloudSender(): Promise<CloudSender> {
	const response = await call(
		"?fields=display_phone_number,verified_name,quality_rating",
	);
	if (!response.ok) throw new Error(`Graph API answered ${response.status}`);
	return senderSchema.parse(await response.json());
}

/** Sends the approved template for this kind of message, in the recipient's language. */
export function sendCloudTemplate(
	to: string,
	kind: SmsKey,
	locale: string | null | undefined,
	vars: Record<string, string>,
) {
	return sendTemplate(to, {
		name: TEMPLATES[kind].name,
		language: { code: toLocale(locale ?? undefined) },
		components: templateComponents(kind, vars),
	});
}

/** Meta's sample template, present on every account: checks the setup end to end. */
export function sendCloudHelloWorld(to: string) {
	return sendTemplate(to, { name: "hello_world", language: { code: "en_US" } });
}

/** The values that fill a template: body variables, then the button. */
export function templateComponents(kind: SmsKey, vars: Record<string, string>) {
	const template = TEMPLATES[kind];
	// Authentication templates: the code fills the body and the copy button.
	if (template.category === "AUTHENTICATION")
		return [
			{ type: "body", parameters: [text(vars.code)] },
			button([text(vars.code)]),
		];

	const body = {
		type: "body",
		parameters: Object.keys(template.params).map((name) => ({
			...text(vars[name] ?? ""),
			parameter_name: name,
		})),
	};
	if (!template.link) return [body];
	return [body, button([text(linkSuffix(vars.url ?? ""))])];
}

/** The button holds the app's address; only the path after it is sent. */
function linkSuffix(url: string) {
	const base = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/`;
	return url.startsWith(base) ? url.slice(base.length) : url;
}

const text = (value: string) => ({ type: "text", text: value });
const button = (parameters: unknown[]) => ({
	type: "button",
	sub_type: "url",
	index: "0",
	parameters,
});

async function sendTemplate(
	to: string,
	template: Record<string, unknown>,
): Promise<SendOutcome> {
	const response = await call("/messages", {
		method: "POST",
		body: JSON.stringify({
			messaging_product: "whatsapp",
			to: to.replace(/^\+/, ""),
			type: "template",
			template,
		}),
	});
	if (response.ok) return "sent";
	const error = await response
		.json()
		.then((data) => data?.error)
		.catch(() => null);
	console.error("WhatsApp Cloud API refused the message:", error);
	return error?.code === NOT_ON_WHATSAPP ? "not-on-whatsapp" : "not-connected";
}
