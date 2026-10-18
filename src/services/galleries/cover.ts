import "server-only";

import { db } from "@/lib/db";
import { getPrivateViewUrl } from "@/lib/storage/r2-private";
import { GALLERY_ITEM_ORDER } from "./constants";

const coverSelect = {
	id: true,
	key: true,
	previewKey: true,
} as const;

/** Something an <img> can show: a photo, or a video with its poster. */
const showable = {
	OR: [{ type: "IMAGE" as const }, { previewKey: { not: null } }],
};

/**
 * The photo on a gallery's cover: the one the photographer chose, or the
 * first one while none is chosen (or the chosen one was deleted).
 */
export async function coverItemOf(gallery: {
	id: string;
	coverItemId: string | null;
}) {
	if (gallery.coverItemId) {
		const chosen = await db.galleryItem.findFirst({
			where: { id: gallery.coverItemId, galleryId: gallery.id, ...showable },
			select: coverSelect,
		});
		if (chosen) return chosen;
	}
	return db.galleryItem.findFirst({
		where: { galleryId: gallery.id, ...showable },
		orderBy: GALLERY_ITEM_ORDER,
		select: coverSelect,
	});
}

/**
 * Where the cover photo loads from. With the originals in hand, a signed
 * link to its preview; otherwise the app's proofing copy, left unmarked: the
 * cover is the photographer's showcase. `token` is for share-link visitors.
 */
export function coverImageUrl(
	item: { id: string; key: string; previewKey: string | null },
	signed: boolean,
	token?: string,
) {
	if (signed) return getPrivateViewUrl(item.previewKey ?? item.key);
	return `/api/galleries/items/${item.id}/proof?cover=1${token ? `&t=${token}` : ""}`;
}

/** Whether this photo is its gallery's cover (shown without the mark). */
export async function isGalleryCover(itemId: string) {
	const item = await db.galleryItem.findUnique({
		where: { id: itemId },
		select: { gallery: { select: { id: true, coverItemId: true } } },
	});
	if (!item) return false;
	return (await coverItemOf(item.gallery))?.id === itemId;
}
