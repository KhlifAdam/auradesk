import { z } from "zod";
import { pageReorderSchema } from "@/services/shared/reorder-page";
import {
	idSchema,
	optionalText,
	requiredText,
} from "@/services/shared/schemas";
import {
	COMMENT_MAX_LENGTH,
	GALLERY_MAX_IMAGE_SIZE,
	galleryMaxSize,
	isGalleryMime,
	isProofMime,
	PART_URLS_PER_REQUEST,
	PREVIEW_MAX_FILE_SIZE,
	SELECTION_LIMIT_MAX,
} from "./constants";

export const galleryViewSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	filter: z.enum(["all", "selected", "flagged"]).catch("all"),
});

export const galleryKindSchema = z.enum(["PROOFS", "FINAL"]);

export const createGallerySchema = z.object({
	projectId: idSchema,
	title: requiredText(120),
	kind: galleryKindSchema,
});

export const gallerySettingsSchema = z.object({
	title: requiredText(120),
	description: optionalText(1000),
	selectionEnabled: z.boolean(),
	watermark: z.boolean(),
	linkSharing: z.boolean(),
	selectionLimit: z
		.number("invalidNumber")
		.int("invalidNumber")
		.min(1, "invalidNumber")
		.max(SELECTION_LIMIT_MAX, "invalidNumber")
		.nullable(),
});

export const updateGallerySchema = gallerySettingsSchema.extend({
	id: idSchema,
});

export const shareGallerySchema = z.object({
	id: idSchema,
	shared: z.boolean(),
});

/** A file to send to a gallery: the server opens (or resumes) its upload. */
export const startUploadSchema = z
	.object({
		galleryId: idSchema,
		filename: z.string().min(1).max(255),
		mimeType: z.string().refine(isGalleryMime, "unsupportedType"),
		size: z.number().int().positive(),
		/** Recognises the same file chosen again, to resume its upload. */
		fingerprint: z.string().min(1).max(600),
		/** Browser-made JPEG preview; null when none could be made (some videos). */
		previewSize: z
			.number()
			.int()
			.positive()
			.max(PREVIEW_MAX_FILE_SIZE, "tooLarge")
			.nullable(),
	})
	.refine((v) => v.size <= galleryMaxSize(v.mimeType), {
		path: ["size"],
		message: "tooLarge",
	});

export const signPartsSchema = z.object({
	sessionId: idSchema,
	partNumbers: z
		.array(z.number().int().min(1).max(10_000))
		.min(1)
		.max(PART_URLS_PER_REQUEST),
});

export const completeUploadSchema = z.object({
	sessionId: idSchema,
	previewSize: z
		.number()
		.int()
		.positive()
		.max(PREVIEW_MAX_FILE_SIZE)
		.nullable(),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	durationSec: z
		.number()
		.positive()
		.max(24 * 60 * 60)
		.optional(),
});

/** A proof: the browser's light copy of a photo whose original stays on disk. */
const proofFields = {
	galleryId: idSchema,
	filename: z.string().min(1).max(255),
	/** Size and date of the original on disk: how it is found again later. */
	originalSize: z
		.number()
		.int()
		.positive()
		.max(GALLERY_MAX_IMAGE_SIZE, "tooLarge"),
	originalModifiedAt: z.number().int().positive(),
	proofSize: z.number().int().positive().max(PREVIEW_MAX_FILE_SIZE, "tooLarge"),
};

export const startProofSchema = z.object({
	...proofFields,
	mimeType: z.string().refine(isProofMime, "unsupportedType"),
});

export const completeProofSchema = z.object({
	...proofFields,
	key: z.string().min(1).max(300),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	capturedAt: z.iso.datetime().nullable(),
	camera: z.string().max(120).nullable(),
});

export const galleryItemIdsSchema = z.object({
	galleryId: idSchema,
	ids: z.array(idSchema).min(1).max(100),
});

export const reorderGalleryItemsSchema = pageReorderSchema.extend({
	galleryId: idSchema,
});

export const COVER_TEMPLATES = ["CLASSIC", "SPLIT", "FRAME", "NONE"] as const;

const focal = z.number().min(0).max(1);

export const galleryCoverSchema = z.object({
	galleryId: idSchema,
	template: z.enum(COVER_TEMPLATES),
	focalX: focal,
	focalY: focal,
});

export const coverPhotoSchema = z.object({
	galleryId: idSchema,
	itemId: idSchema,
});

/** Days a share link stays open; 0 keeps it until the client stops it. */
export const SHARE_EXPIRY_DAYS = [0, 7, 30] as const;

export const shareLinkSchema = z.object({
	galleryId: idSchema,
	downloads: z.boolean(),
	expiresInDays: z.union(SHARE_EXPIRY_DAYS.map((days) => z.literal(days))),
});

export const selectAllSchema = z.object({
	galleryId: idSchema,
	selected: z.boolean(),
});

export const toggleSelectionSchema = z.object({
	itemId: idSchema,
	selected: z.boolean(),
});

export const addCommentSchema = z.object({
	itemId: idSchema,
	body: requiredText(COMMENT_MAX_LENGTH),
});

export type GallerySettingsValues = z.infer<typeof gallerySettingsSchema>;
