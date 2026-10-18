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
 * The client's proofing copy, served (and marked) by the app itself. `marked`
 * only changes the URL, so the browser drops its copy when the setting flips.
 * `token` lets a share-link visitor (no account) load it.
 */
export const proofUrl = (
	item: { id: string; type: string; previewKey: string | null },
	marked: boolean,
	token?: string,
) =>
	item.previewKey || item.type === "IMAGE"
		? `/api/galleries/items/${item.id}/proof?m=${marked ? 1 : 0}${token ? `&t=${token}` : ""}`
		: null;

interface PhotoOptions {
	/** Signed links to the originals; otherwise proofing copies. */
	originals: boolean;
	/** The AI assistant's flags, for the photographer only. */
	showFlags?: boolean;
	/** Proofing copies carry the studio's mark. */
	marked?: boolean;
	/** Share-link token, for visitors without an account. */
	token?: string;
}

/**
 * Only call after an access check: the URLs grant read access to the files.
 * Without `originals` (a client choosing before delivery) nothing in the
 * bucket is signed at all: the app serves a proofing copy instead.
 */
export async function toGalleryPhoto(
	item: ItemRow,
	{ originals, showFlags = false, marked = true, token }: PhotoOptions,
): Promise<GalleryPhoto> {
	const [original, preview] = originals
		? await Promise.all([
				getPrivateViewUrl(item.key),
				item.previewKey ? getPrivateViewUrl(item.previewKey) : null,
			])
		: [null, proofUrl(item, marked, token)];
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
