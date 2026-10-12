import "server-only";

import { db } from "@/lib/db";
import { type OrganizeSummary, prefixFromTitle } from "./organize";

/** Where a gallery stands before organising: dates, sources, what's left to read. */
export async function getOrganizeSummary(
	photographerId: string,
	galleryId: string,
	projectTitle: string,
): Promise<OrganizeSummary> {
	const where = { galleryId, photographerId };
	const [total, pending, undated, range, sources, renamed] = await Promise.all([
		db.galleryItem.count({ where }),
		db.galleryItem.count({ where: { ...where, metadataReadAt: null } }),
		db.galleryItem.count({
			where: { ...where, metadataReadAt: { not: null }, capturedAt: null },
		}),
		db.galleryItem.aggregate({
			where,
			_min: { capturedAt: true },
			_max: { capturedAt: true },
		}),
		db.galleryItem.groupBy({
			by: ["camera"],
			where: { ...where, metadataReadAt: { not: null } },
			_count: { _all: true },
			orderBy: { _count: { camera: "desc" } },
		}),
		db.galleryItem.count({
			where: { ...where, originalFilename: { not: null } },
		}),
	]);

	return {
		total,
		pending,
		undated,
		firstAt: range._min.capturedAt?.toISOString() ?? null,
		lastAt: range._max.capturedAt?.toISOString() ?? null,
		sources: sources
			.map((row) => ({ camera: row.camera, count: row._count._all }))
			.sort((a, b) => b.count - a.count),
		renamed,
		defaultPrefix: prefixFromTitle(projectTitle),
	};
}
