import "server-only";

import { isVisionEnabled } from "@/lib/ai/claude";
import type { Silence } from "@/lib/ai/video-metrics";
import { db } from "@/lib/db";
import type { VideoCategory } from "./options";

export interface VideoReport {
	itemId: string;
	filename: string;
	durationSec: number;
	sceneCuts: number[];
	silences: Silence[];
	hasAudio: boolean;
	silenceRatio: number;
	category: VideoCategory | null;
	summary: string;
}

export interface VideoInsights {
	videos: number;
	analysed: number;
	visionEnabled: boolean;
	/** Reports for the videos on the gallery page being shown. */
	reports: VideoReport[];
}

/**
 * Video totals for a gallery, plus the reports of the videos on the current
 * page (the grid is paginated, so the reports follow it).
 */
export async function getVideoInsights(
	photographerId: string,
	galleryId: string,
	pageItemIds: string[],
): Promise<VideoInsights> {
	const [videos, analysed, rows] = await Promise.all([
		db.galleryItem.count({
			where: { galleryId, photographerId, type: "VIDEO" },
		}),
		db.videoAnalysis.count({ where: { galleryId, item: { photographerId } } }),
		db.videoAnalysis.findMany({
			where: { itemId: { in: pageItemIds }, item: { photographerId } },
			include: { item: { select: { filename: true, position: true } } },
			orderBy: [{ item: { position: "asc" } }, { id: "asc" }],
		}),
	]);

	return {
		videos,
		analysed,
		visionEnabled: isVisionEnabled(),
		reports: rows.map((row) => ({
			itemId: row.itemId,
			filename: row.item.filename,
			durationSec: row.durationSec,
			sceneCuts: row.sceneCuts,
			silences: Array.isArray(row.silences)
				? (row.silences as unknown as Silence[])
				: [],
			hasAudio: row.hasAudio,
			silenceRatio: row.silenceRatio,
			category: (row.category as VideoCategory | null) ?? null,
			summary: row.summary ?? "",
		})),
	};
}
