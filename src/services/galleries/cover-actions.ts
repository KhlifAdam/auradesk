"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { coverPhotoSchema, galleryCoverSchema } from "./schemas";

/** Layout of the gallery's cover page and the point kept in frame. */
export async function updateGalleryCover(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = galleryCoverSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, template, focalX, focalY } = parsed.data;

	const { count } = await db.gallery.updateMany({
		where: { id: galleryId, photographerId },
		data: { coverTemplate: template, coverFocalX: focalX, coverFocalY: focalY },
	});
	if (count === 0) return fail("notFound");

	revalidateClientWork();
	return ok();
}

/** A photo of the gallery becomes its cover; the focal point starts centred. */
export async function setGalleryCover(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = coverPhotoSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, itemId } = parsed.data;

	// The photo must be one of this gallery's, which must be this photographer's.
	const item = await db.galleryItem.findFirst({
		where: { id: itemId, galleryId, photographerId },
		select: { id: true },
	});
	if (!item) return fail("notFound");

	await db.gallery.update({
		where: { id: galleryId },
		data: { coverItemId: itemId, coverFocalX: 0.5, coverFocalY: 0.5 },
	});
	revalidateClientWork();
	return ok();
}
