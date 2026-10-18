import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { coverImageUrl, coverItemOf } from "./cover";
import type { GallerySummary } from "./types";

/**
 * Gallery cards for a project, each with its cover photo. Callers scope
 * `where` to the viewer; a client passes `client`, and gets the app's copy of
 * the cover until the originals are theirs.
 */
export async function listGallerySummaries(
	where: Prisma.GalleryWhereInput,
	client?: { delivered: boolean },
): Promise<GallerySummary[]> {
	const galleries = await db.gallery.findMany({
		where,
		orderBy: [{ position: "asc" }, { createdAt: "asc" }],
		include: {
			_count: { select: { items: true } },
			project: { select: { eventDate: true } },
		},
	});
	if (galleries.length === 0) return [];

	const selected = await db.galleryItem.groupBy({
		by: ["galleryId"],
		where: { galleryId: { in: galleries.map((g) => g.id) }, selected: true },
		_count: { _all: true },
	});
	const selectedBy = new Map(selected.map((s) => [s.galleryId, s._count._all]));

	return Promise.all(
		galleries.map(async (gallery) => {
			const cover = await coverItemOf(gallery);
			const signed = !client || (client.delivered && gallery.kind === "FINAL");
			const imageUrl = cover ? await coverImageUrl(cover, signed) : null;
			return {
				id: gallery.id,
				title: gallery.title,
				kind: gallery.kind,
				itemCount: gallery._count.items,
				selectedCount: selectedBy.get(gallery.id) ?? 0,
				shared: Boolean(gallery.sharedAt),
				submitted: Boolean(gallery.submittedAt),
				coverUrl: imageUrl,
				cover: {
					template: gallery.coverTemplate,
					itemId: cover?.id ?? null,
					imageUrl,
					focalX: gallery.coverFocalX,
					focalY: gallery.coverFocalY,
					date: gallery.project.eventDate?.toISOString() ?? null,
				},
			};
		}),
	);
}
