import "server-only";

import { db } from "@/lib/db";
import { toMediaItem } from "@/services/media/queries";
import type { MediaItem } from "@/services/media/types";
import { listAllAlbums } from "@/services/portfolio/queries";
import type { AlbumSummary } from "@/services/portfolio/types";
import { normalizeSections, sectionMediaIds } from "./normalize";
import type { SiteSectionConfig } from "./schemas";

export interface SectionsEditorData {
	sections: SiteSectionConfig[];
	/** The media the sections use, for the editor's previews. */
	media: Record<string, MediaItem>;
	/** Every album, to pick the ones the portfolio section shows. */
	albums: AlbumSummary[];
}

/** The sections editor's starting point; null when there is no studio yet. */
export async function getSectionsEditorData(
	photographerId: string,
): Promise<SectionsEditorData | null> {
	const studio = await db.studio.findUnique({
		where: { photographerId },
		select: { sections: true },
	});
	if (!studio) return null;

	const sections = normalizeSections(studio.sections);
	const [rows, albums] = await Promise.all([
		db.media.findMany({
			where: { id: { in: sectionMediaIds(sections) }, photographerId },
		}),
		listAllAlbums(photographerId),
	]);
	return {
		sections,
		albums,
		media: Object.fromEntries(rows.map((row) => [row.id, toMediaItem(row)])),
	};
}
