import { z } from "zod";
import { pageReorderSchema } from "@/services/shared/reorder-page";
import {
	idSchema,
	optionalText,
	requiredText,
	slugSchema,
} from "@/services/shared/schemas";

/** Hard limits on how many albums and photos one photographer can keep. */
export const MAX_ALBUMS = 100;
export const MAX_ALBUM_ITEMS = 300;

export const ALBUM_PAGE_SIZE = 12;
export const ALBUM_ITEM_PAGE_SIZE = 24;

export const albumSchema = z.object({
	title: requiredText(80),
	slug: slugSchema,
	description: optionalText(500),
	published: z.boolean(),
});

export const updateAlbumSchema = albumSchema.extend({ id: idSchema });

export const albumPublishedSchema = z.object({
	id: idSchema,
	published: z.boolean(),
});

export const albumItemsSchema = z.object({
	albumId: idSchema,
	mediaIds: z.array(idSchema).min(1).max(MAX_ALBUM_ITEMS),
});

export const reorderAlbumItemsSchema = pageReorderSchema.extend({
	albumId: idSchema,
});

export const albumItemSchema = z.object({
	albumId: idSchema,
	mediaId: idSchema,
});

export const albumCoverSchema = z.object({
	albumId: idSchema,
	mediaId: idSchema.nullable(),
});

export type AlbumValues = z.infer<typeof albumSchema>;
