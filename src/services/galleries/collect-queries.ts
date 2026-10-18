import "server-only";

import { db } from "@/lib/db";

export interface PickToCollect {
	/** The name the original has on the photographer's disk. */
	name: string;
	size: number;
	modifiedAt: number;
	/** When it was taken (or uploaded), for the new name's date and order. */
	takenAt: string;
}

/**
 * The picked photos of a proofs gallery, in shooting order, with what the
 * browser needs to find their originals on disk again.
 */
export async function listPicksToCollect(
	photographerId: string,
	galleryId: string,
): Promise<PickToCollect[]> {
	const rows = await db.galleryItem.findMany({
		where: {
			galleryId,
			photographerId,
			selected: true,
			originalSize: { not: null },
			gallery: { kind: "PROOFS" },
		},
		orderBy: [
			{ capturedAt: { sort: "asc", nulls: "last" } },
			{ createdAt: "asc" },
		],
		select: {
			filename: true,
			originalFilename: true,
			originalSize: true,
			originalModifiedAt: true,
			capturedAt: true,
			createdAt: true,
		},
	});
	return rows.map((row) => ({
		// An organised gallery renamed its proofs; the disk kept the old name.
		name: row.originalFilename ?? row.filename,
		size: Number(row.originalSize),
		modifiedAt: row.originalModifiedAt?.getTime() ?? 0,
		takenAt: (row.capturedAt ?? row.createdAt).toISOString(),
	}));
}
