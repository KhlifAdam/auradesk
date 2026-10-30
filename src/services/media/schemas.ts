import { z } from "zod";
import { MEDIA_LIMITS, mediaKindOf } from "./constants";

const fileFields = {
	filename: z.string().min(1).max(255),
	mimeType: z.string(),
	size: z.number().int().positive(),
};

function withinLimits(
	file: { mimeType: string; size: number },
	ctx: z.RefinementCtx,
) {
	const kind = mediaKindOf(file.mimeType);
	if (!kind) {
		ctx.addIssue({ code: "custom", message: "unsupportedType" });
	} else if (file.size > MEDIA_LIMITS[kind].maxSize) {
		ctx.addIssue({ code: "custom", message: "tooLarge" });
	}
}

export const requestUploadSchema = z
	.object(fileFields)
	.superRefine(withinLimits);

export const confirmUploadSchema = z
	.object({
		...fileFields,
		key: z.string().min(1),
		width: z.number().int().positive().optional(),
		height: z.number().int().positive().optional(),
		durationSec: z.number().nonnegative().optional(),
	})
	.superRefine(withinLimits);

export const updateMediaSchema = z.object({
	id: z.string().min(1),
	alt: z.string().trim().max(300),
});

/** The point kept in view when the image is cropped, in percent. */
export const mediaFocusSchema = z.object({
	id: z.string().min(1),
	focusX: z.number().min(0).max(100),
	focusY: z.number().min(0).max(100),
});

export const mediaIdsSchema = z.array(z.string().min(1)).min(1).max(100);

export const mediaFilterSchema = z.enum(["all", "image", "video"]).catch("all");

export const listMediaSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	type: mediaFilterSchema,
});

export type MediaFilter = z.infer<typeof mediaFilterSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
