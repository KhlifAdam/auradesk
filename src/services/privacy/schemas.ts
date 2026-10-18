import { z } from "zod";

/** Months after delivery before galleries are deleted; "" keeps them. */
export const RETENTION_CHOICES = ["", "3", "6", "12", "24"] as const;

export const privacySettingsSchema = z.object({
	retention: z.enum(RETENTION_CHOICES),
	stripLocation: z.boolean(),
});

export type PrivacySettingsValues = z.infer<typeof privacySettingsSchema>;
