import { z } from "zod";
import { toE164 } from "@/lib/phone";
import { SMS_KINDS } from "@/lib/sms/sms-kinds";

export const WHATSAPP_CHANNELS = ["BAILEYS", "CLOUD"] as const;

/** The admin's "send a test message" form. */
export const whatsappTestSchema = z.object({
	phone: z
		.string()
		.trim()
		.refine((value) => toE164(value) !== null, "invalidPhone"),
	channel: z.enum(WHATSAPP_CHANNELS),
});

export type WhatsappTestInput = z.infer<typeof whatsappTestSchema>;

/** One row of the routing table: which WhatsApp sends this kind of message. */
export const whatsappRouteSchema = z.object({
	kind: z.enum(SMS_KINDS),
	channel: z.enum(WHATSAPP_CHANNELS),
});
