"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { flaggedItemWhere } from "@/services/ai/photo-flags";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockGallery } from "@/services/shared/lock-rows";
import { pageSkip } from "@/services/shared/pagination";
import { planPageReorder } from "@/services/shared/reorder-page";
import { idSchema } from "@/services/shared/schemas";
import { deleteGalleryFiles } from "./cleanup";
import { GALLERY_PAGE_SIZE } from "./constants";
import { GALLERY_ITEM_ORDER } from "./queries";
import {
	galleryItemIdsSchema,
	reorderGalleryItemsSchema,
	toggleSelectionSchema,
} from "./schemas";

function ownsGallery(photographerId: string, galleryId: string) {
	return db.gallery.findFirst({
		where: { id: galleryId, photographerId },
		select: { id: true },
	});
}

export async function deleteGalleryItems(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = galleryItemIdsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, ids } = parsed.data;

	const where = { id: { in: ids }, galleryId, photographerId };
	const files = await db.galleryItem.findMany({
		where,
		select: { key: true, previewKey: true },
	});
	if (files.length === 0) return fail("notFound");

	await db.galleryItem.deleteMany({ where });
	await deleteGalleryFiles(files);
	revalidateClientWork();
	return ok();
}

export async function reorderGalleryItems(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = reorderGalleryItemsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, page, ids } = parsed.data;
	if (!(await ownsGallery(photographerId, galleryId))) return fail("notFound");

	const reordered = await db.$transaction(async (tx) => {
		await lockGallery(tx, galleryId);
		const current = await tx.galleryItem.findMany({
			where: { galleryId },
			orderBy: GALLERY_ITEM_ORDER,
			skip: pageSkip(page, GALLERY_PAGE_SIZE),
			take: GALLERY_PAGE_SIZE,
			select: { id: true, position: true },
		});
		const next = planPageReorder(current, ids);
		if (!next) return false;
		for (const { id, position } of next) {
			await tx.galleryItem.update({ where: { id }, data: { position } });
		}
		return true;
	});
	if (!reordered) return fail("staleOrder");

	revalidateClientWork();
	return ok();
}

/**
 * After the AI review: drops the photos it flagged (blurry, eyes closed…)
 * from a proofs gallery. Only light copies go: the originals stay on the
 * photographer's disk. Photos already picked are kept.
 */
export async function removeFlaggedProofs(
	input: unknown,
): Promise<ActionResult<{ removed: number }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const where = {
		...flaggedItemWhere,
		galleryId: parsed.data,
		photographerId,
		selected: false,
		gallery: { kind: "PROOFS" as const },
	};
	const files = await db.galleryItem.findMany({
		where,
		select: { key: true, previewKey: true },
	});
	if (files.length === 0) return ok({ removed: 0 });

	await db.galleryItem.deleteMany({ where });
	await deleteGalleryFiles(files);
	revalidateClientWork();
	return ok({ removed: files.length });
}

/** The photographer's own pick, for when the client doesn't choose. */
export async function pickGalleryItem(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = toggleSelectionSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { itemId, selected } = parsed.data;

	const { count } = await db.galleryItem.updateMany({
		where: { id: itemId, photographerId },
		data: { selected },
	});
	if (count === 0) return fail("notFound");

	revalidateClientWork();
	return ok();
}
