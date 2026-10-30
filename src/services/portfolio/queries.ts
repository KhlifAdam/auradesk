import "server-only";

import { db } from "@/lib/db";
import { toMediaItem } from "@/services/media/queries";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { ALBUM_ITEM_PAGE_SIZE, ALBUM_PAGE_SIZE, MAX_ALBUMS } from "./schemas";
import type { AlbumDetail, AlbumPage, AlbumSummary } from "./types";

const ALBUM_ORDER = [{ position: "asc" as const }, { id: "asc" as const }];

async function albumSummaries(
	photographerId: string,
	window: { skip: number; take: number },
): Promise<AlbumSummary[]> {
	const albums = await db.album.findMany({
		where: { photographerId },
		orderBy: ALBUM_ORDER,
		...window,
		include: {
			cover: true,
			items: {
				orderBy: { position: "asc" },
				take: 1,
				include: { media: true },
			},
			_count: { select: { items: true } },
		},
	});
	return albums.map((album) => {
		const cover = album.cover ?? album.items[0]?.media ?? null;
		return {
			id: album.id,
			title: album.title,
			slug: album.slug,
			description: album.description ?? "",
			published: album.published,
			itemCount: album._count.items,
			cover: cover ? toMediaItem(cover) : null,
		};
	});
}

export async function listAlbums(
	photographerId: string,
	requestedPage: number,
): Promise<AlbumPage> {
	const total = await db.album.count({ where: { photographerId } });
	const meta = pageMeta(requestedPage, total, ALBUM_PAGE_SIZE);
	const items = await albumSummaries(photographerId, {
		skip: pageSkip(meta.page, ALBUM_PAGE_SIZE),
		take: ALBUM_PAGE_SIZE,
	});
	return { ...meta, items };
}

/** Every album, up to the album limit: for picking the ones on the site. */
export function listAllAlbums(photographerId: string) {
	return albumSummaries(photographerId, { skip: 0, take: MAX_ALBUMS });
}

export async function getAlbum(
	photographerId: string,
	albumId: string,
	requestedPage: number,
): Promise<AlbumDetail | null> {
	const album = await db.album.findFirst({
		where: { id: albumId, photographerId },
		include: { cover: true },
	});
	if (!album) return null;

	const total = await db.albumItem.count({ where: { albumId } });
	const meta = pageMeta(requestedPage, total, ALBUM_ITEM_PAGE_SIZE);
	const rows = await db.albumItem.findMany({
		where: { albumId },
		orderBy: [{ position: "asc" }, { mediaId: "asc" }],
		skip: pageSkip(meta.page, ALBUM_ITEM_PAGE_SIZE),
		take: ALBUM_ITEM_PAGE_SIZE,
		include: { media: true },
	});

	const cover =
		album.cover ??
		(
			await db.albumItem.findFirst({
				where: { albumId },
				orderBy: [{ position: "asc" }, { mediaId: "asc" }],
				include: { media: true },
			})
		)?.media ??
		null;

	return {
		id: album.id,
		title: album.title,
		slug: album.slug,
		description: album.description ?? "",
		published: album.published,
		itemCount: total,
		coverMediaId: album.coverMediaId,
		cover: cover ? toMediaItem(cover) : null,
		items: rows.map((row) => toMediaItem(row.media)),
		page: meta.page,
		pageCount: meta.pageCount,
	};
}
