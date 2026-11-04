import "server-only";

import type { WhatsappStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { CodeChannel } from "./code-channel";
import { sendWhatsappAlert } from "./send-admin-alert";

const ROW_ID = "main";

/** True when texts are meant to go out over WhatsApp at all. */
export function whatsappEnabled() {
	return process.env.SMS_PROVIDER === "whatsapp";
}

/** How sign-in codes go out right now. */
export async function codeChannel(): Promise<CodeChannel> {
	if (!whatsappEnabled()) return "sms";
	const connection = await readConnection();
	return connection?.status === "CONNECTED" ? "whatsapp" : "sms";
}

/** The last status reported; null before the gateway's first report. */
export function readConnection() {
	return db.whatsappConnection.findUnique({ where: { id: ROW_ID } });
}

/** The gateway didn't answer: down, unless already known to be logged out. */
export async function markGatewayUnreachable() {
	const saved = await readConnection();
	if (saved?.status === "LOGGED_OUT") return;
	await recordStatus("DOWN", { reason: "gateway unreachable" });
}

/**
 * Saves the link's status. The admins get one email per outage: the first
 * time it is reported down or logged out, then not again until it reconnects.
 * `silent` (an admin unlinking on purpose) counts as already alerted.
 */
export async function recordStatus(
	status: WhatsappStatus,
	details: {
		phone?: string | null;
		reason?: string | null;
		silent?: boolean;
	} = {},
) {
	const previous = await readConnection();
	const changed = previous?.status !== status;
	const outage = status !== "CONNECTED" && !previous?.alertedAt;
	const shouldAlert = outage && !details.silent;

	await db.whatsappConnection.upsert({
		where: { id: ROW_ID },
		create: {
			id: ROW_ID,
			status,
			phoneNumber: details.phone ?? null,
			reason: details.reason ?? null,
			alertedAt: outage ? new Date() : null,
		},
		update: {
			status,
			// Keep the number known while the link is down.
			...(details.phone ? { phoneNumber: details.phone } : {}),
			...(changed
				? { changedAt: new Date(), reason: details.reason ?? null }
				: {}),
			...(status === "CONNECTED" ? { alertedAt: null } : {}),
			...(outage ? { alertedAt: new Date() } : {}),
		},
	});

	if (shouldAlert)
		await sendWhatsappAlert(
			status,
			previous?.phoneNumber ?? details.phone,
		).catch((error) =>
			console.error("Failed to email the WhatsApp alert:", error),
		);
	return { changed };
}
