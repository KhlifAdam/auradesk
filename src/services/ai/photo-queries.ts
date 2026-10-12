import "server-only";

import { isVisionEnabled } from "@/lib/ai/claude";
import { db } from "@/lib/db";
import { PHOTO_FLAGS, type PhotoFlag } from "./options";

export interface GalleryInsights {
	/** Photos in the gallery (videos aren't analysed). */
	photos: number;
	analysed: number;
	/** Photos with at least one flag. */
	flagged: number;
	counts: Record<PhotoFlag, number>;
	/** Whether closed eyes can be checked (needs a Claude API key). */
	visionEnabled: boolean;
}

export async function getGalleryInsights(
	photographerId: string,
	galleryId: string,
): Promise<GalleryInsights> {
	const [photos, rows] = await Promise.all([
		db.galleryItem.count({
			where: { galleryId, photographerId, type: "IMAGE" },
		}),
		db.photoAnalysis.findMany({
			where: { galleryId, item: { photographerId } },
			select: { flags: true },
		}),
	]);
	const counts = Object.fromEntries(
		PHOTO_FLAGS.map((flag) => [flag, 0]),
	) as Record<PhotoFlag, number>;
	for (const row of rows)
		for (const flag of row.flags)
			if (flag in counts) counts[flag as PhotoFlag]++;

	return {
		photos,
		analysed: rows.length,
		flagged: rows.filter((row) => row.flags.length > 0).length,
		counts,
		visionEnabled: isVisionEnabled(),
	};
}
