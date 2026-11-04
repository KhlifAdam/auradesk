import { z } from "zod";

/** The other account's email or phone number, as typed. */
export const linkRequestSchema = z.object({
	contact: z.string().trim().min(1).max(320),
});

export const linkConfirmSchema = linkRequestSchema.extend({
	code: z.string().regex(/^\d{6}$/),
});

/** Which contact the signed-in account is missing, hence can link by. */
export type LinkMode = "email" | "phone";
