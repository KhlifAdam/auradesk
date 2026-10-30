import "server-only";

import type { Media, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/storage/r2";
import { MEDIA_PAGE_SIZE } from "./constants";
import type { MediaFilter } from "./schemas";
import type { MediaItem, MediaPage } from "./types";

export function toMediaItem(media: Media): MediaItem {
	return {
		id: media.id,
		type: media.type,
		url: publicUrl(media.key),
		filename: media.filename,
		mimeType: media.mimeType,
		size: media.size,
		width: media.width,
		height: media.height,
		durationSec: media.durationSec,
		alt: media.alt,
		focusX: media.focusX,
		focusY: media.focusY,
		createdAt: media.createdAt.toISOString(),
	};
}

const TYPE_FILTER: Record<MediaFilter, Prisma.MediaWhereInput> = {
	all: {},
	image: { type: "IMAGE" },
	video: { type: "VIDEO" },
};

export async function listMedia(
	photographerId: string,
	{ page, type }: { page: number; type: MediaFilter },
): Promise<MediaPage> {
	const where = { photographerId, ...TYPE_FILTER[type] };
	const [total, rows] = await Promise.all([
		db.media.count({ where }),
		db.media.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * MEDIA_PAGE_SIZE,
			take: MEDIA_PAGE_SIZE,
		}),
	]);

	return {
		items: rows.map(toMediaItem),
		page,
		pageCount: Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE)),
		total,
	};
}
