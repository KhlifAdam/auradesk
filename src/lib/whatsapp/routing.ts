import "server-only";

import type { WhatsappChannel } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { SMS_KINDS, type SmsKey } from "@/lib/sms/sms-copy";

/**
 * Where each kind of message goes when WhatsApp is on. Sign-in codes use the
 * official API; the rest the linked number. An admin can flip any of them.
 */
export const DEFAULT_ROUTES: Record<SmsKey, WhatsappChannel> = {
	otp: "CLOUD",
	projectInvitation: "BAILEYS",
	galleryShared: "BAILEYS",
	newMessage: "BAILEYS",
	bookingSent: "BAILEYS",
	projectCreated: "BAILEYS",
	galleriesReady: "BAILEYS",
	projectDelivered: "BAILEYS",
	changeForClient: "BAILEYS",
	changeForStudio: "BAILEYS",
};

/** The channel that sends this kind of message right now. */
export async function routeFor(kind: SmsKey): Promise<WhatsappChannel> {
	const row = await db.whatsappRoute
		.findUnique({ where: { kind } })
		.catch((error) => {
			// A message still goes out (by default) when the setting can't be read.
			console.error("Failed to read the WhatsApp route:", error);
			return null;
		});
	return row?.channel ?? DEFAULT_ROUTES[kind];
}

/** Every kind with its channel, in display order. */
export async function allRoutes() {
	const rows = await db.whatsappRoute.findMany();
	const saved = new Map(rows.map((row) => [row.kind, row.channel]));
	return SMS_KINDS.map((kind) => ({
		kind,
		channel: saved.get(kind) ?? DEFAULT_ROUTES[kind],
	}));
}
