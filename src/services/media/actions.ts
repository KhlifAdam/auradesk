"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { revalidatePublicSites } from "@/lib/public-site/cache";
import { deleteObjects, getUploadUrl, headObject } from "@/lib/storage/r2";
import { EXTENSION_BY_MIME, mediaKindOf } from "./constants";
import { listMedia, toMediaItem } from "./queries";
import {
	confirmUploadSchema,
	listMediaSchema,
	mediaIdsSchema,
	requestUploadSchema,
	updateMediaSchema,
} from "./schemas";
import type { MediaItem, MediaPage } from "./types";

const MEDIA_PATH = "/dashboard/portfolio/files";

export async function requestUpload(
	input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = requestUploadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { mimeType, size } = parsed.data;
	const key = `${photographerId}/${randomUUID()}.${EXTENSION_BY_MIME[mimeType]}`;

	return ok({ key, uploadUrl: await getUploadUrl(key, mimeType, size) });
}

export async function confirmUpload(
	input: unknown,
): Promise<ActionResult<MediaItem>> {
	const { photographerId } = await requirePhotographer();
	const parsed = confirmUploadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { key, size, mimeType, ...meta } = parsed.data;
	// Keys are namespaced by owner; never accept another tenant's object.
	if (!key.startsWith(`${photographerId}/`)) return fail("invalidInput");

	const stored = await headObject(key);
	if (!stored || stored.size !== size) return fail("uploadMissing");

	const type = mediaKindOf(mimeType);
	if (!type) return fail("unsupportedType");

	const media = await db.media
		.create({ data: { photographerId, key, size, mimeType, type, ...meta } })
		.catch(async (error) => {
			if (!isUniqueViolation(error)) throw error;
			// Confirming twice (retry, double click) is harmless: return the row
			// that already exists. Keys start with the owner's id, so it is theirs.
			return db.media.findFirst({ where: { key, photographerId } });
		});
	if (!media) return fail("invalidInput");

	revalidatePath(MEDIA_PATH);
	return ok(toMediaItem(media));
}

export async function updateMedia(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateMediaSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, alt } = parsed.data;
	const { count } = await db.media.updateMany({
		where: { id, photographerId },
		data: { alt: alt || null },
	});
	if (count === 0) return fail("notFound");

	revalidatePath(MEDIA_PATH);
	revalidatePublicSites();
	return ok();
}

export async function deleteMedia(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = mediaIdsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const media = await db.media.findMany({
		where: { id: { in: parsed.data }, photographerId },
		select: { id: true, key: true },
	});
	if (media.length === 0) return fail("notFound");

	// Logo/cover references are cleared by `onDelete: SetNull`, album items cascade.
	await db.media.deleteMany({
		where: { id: { in: media.map((m) => m.id) }, photographerId },
	});
	await deleteObjects(media.map((m) => m.key)).catch((error) =>
		console.error("Failed to delete R2 objects:", error),
	);

	revalidatePath("/dashboard", "layout");
	revalidatePublicSites();
	return ok();
}

/** Paginated listing for client-side pickers. */
export async function fetchMediaPage(
	input: unknown,
): Promise<ActionResult<MediaPage>> {
	const { photographerId } = await requirePhotographer();
	const parsed = listMediaSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	return ok(await listMedia(photographerId, parsed.data));
}
