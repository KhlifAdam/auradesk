import "server-only";

import { z } from "zod";

const gatewaySchema = z.object({
	WA_GATEWAY_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
	WA_GATEWAY_SECRET: z.string().min(32),
});

export const linkStatusSchema = z.object({
	state: z.enum(["LOGGED_OUT", "QR_PENDING", "CONNECTING", "CONNECTED"]),
	qr: z.string().nullable(),
	phone: z.string().nullable(),
	since: z.string(),
	lastError: z.string().nullable(),
});

export type LinkStatus = z.infer<typeof linkStatusSchema>;

/** The gateway's answer to a send: delivered, or why it could not be. */
export type SendOutcome = "sent" | "not-connected" | "not-on-whatsapp";

/** True when the app knows where the WhatsApp gateway is. */
export function gatewayConfigured() {
	return gatewaySchema.safeParse(process.env).success;
}

/**
 * Calls the private `wa-gateway` service (see wa-gateway/). Throws when it
 * can't be reached, so callers can tell "down" from a refused message.
 */
async function call(path: string, init?: RequestInit & { timeoutMs?: number }) {
	const { WA_GATEWAY_URL, WA_GATEWAY_SECRET } = gatewaySchema.parse(
		process.env,
	);
	return fetch(`${WA_GATEWAY_URL}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${WA_GATEWAY_SECRET}`,
			"Content-Type": "application/json",
		},
		signal: AbortSignal.timeout(init?.timeoutMs ?? 5_000),
		cache: "no-store",
	});
}

async function statusFrom(response: Response) {
	if (!response.ok) throw new Error(`Gateway answered ${response.status}`);
	return linkStatusSchema.parse(await response.json());
}

export async function getLinkStatus() {
	return statusFrom(await call("/status"));
}

/** Opens the connection; shows a fresh QR code when no device is linked. */
export async function requestLink() {
	return statusFrom(
		await call("/connect", { method: "POST", timeoutMs: 15_000 }),
	);
}

export async function unlink() {
	return statusFrom(
		await call("/logout", { method: "POST", timeoutMs: 15_000 }),
	);
}

/** Sends a text; messages are queued on the gateway, hence the long wait. */
export async function sendWhatsappText(
	to: string,
	body: string,
): Promise<SendOutcome> {
	const response = await call("/send", {
		method: "POST",
		body: JSON.stringify({ to, body }),
		timeoutMs: 30_000,
	});
	if (response.ok) return "sent";
	if (response.status === 503) return "not-connected";
	if (response.status === 422) return "not-on-whatsapp";
	throw new Error(`Gateway answered ${response.status}`);
}
