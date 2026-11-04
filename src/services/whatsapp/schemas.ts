import { z } from "zod";
import { toE164 } from "@/lib/phone";

/** The admin's "send a test message" form. */
export const whatsappTestSchema = z.object({
	phone: z
		.string()
		.trim()
		.refine((value) => toE164(value) !== null, "invalidPhone"),
});

export type WhatsappTestInput = z.infer<typeof whatsappTestSchema>;
