import "server-only";

import { getPrivateViewUrl } from "@/lib/storage/r2-private";
import type { GalleryPhoto } from "./types";

interface ItemRow {
	id: string;
	key: string;
	previewKey: string | null;
	type: "IMAGE" | "VIDEO";
	filename: string;
	durationSec: number | null;
	width: number | null;
	height: number | null;
	selected: boolean;
	_count: { comments: number };
	analysis: { flags: string[] } | null;
}

export const galleryItemSelect = {
	id: true,
	key: true,
	previewKey: true,
	type: true,
	filename: true,
	durationSec: true,
	width: true,
	height: true,
	selected: true,
	_count: { select: { comments: true } },
	analysis: { select: { flags: true } },
} as const;

/**
 * Only call after an access check: the URLs grant read access to the files.
 * Without `originals` (a client choosing before delivery) no URL to the
 * original is ever signed: the preview stands in for it.
 */
export async function toGalleryPhoto(
	item: ItemRow,
	originals: boolean,
	showFlags = false,
): Promise<GalleryPhoto> {
	const [original, preview] = await Promise.all([
		originals ? getPrivateViewUrl(item.key) : null,
		item.previewKey ? getPrivateViewUrl(item.previewKey) : null,
	]);
	// A photo can stand in for its own preview; a video file can't.
	const previewUrl = preview ?? (item.type === "IMAGE" ? original : null);
	return {
		id: item.id,
		type: item.type,
		filename: item.filename,
		durationSec: item.durationSec,
		width: item.width,
		height: item.height,
		selected: item.selected,
		commentCount: item._count.comments,
		previewUrl,
		fullUrl: original ?? (item.type === "IMAGE" ? previewUrl : null),
		flags: showFlags ? (item.analysis?.flags ?? []) : [],
	};
}

export function signPreview(item: { key: string; previewKey: string | null }) {
	return getPrivateViewUrl(item.previewKey ?? item.key);
}
