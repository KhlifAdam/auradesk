import { z } from "zod";
import { idSchema } from "@/services/shared/schemas";

/** The browser shrinks the photo to a small JPEG before sending it. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_EDGE = 512;

export const avatarUploadSchema = z.object({
	size: z.number().int().positive().max(AVATAR_MAX_BYTES, "tooLarge"),
});

export const avatarKeySchema = z.object({ key: z.string().min(1).max(200) });

export const sessionIdSchema = idSchema;
