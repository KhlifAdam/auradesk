import "server-only";

import { db } from "@/lib/db";
import { loadSiteBlocks } from "@/services/public-site/sections";
import type { SiteBlock } from "@/services/public-site/types";
import { normalizeDraftSections } from "@/services/site-sections/normalize";

/** The sections being edited, ready to render; null when there is no draft. */
export async function loadDraftBlocks(
	photographerId: string,
): Promise<SiteBlock[] | null> {
	const studio = await db.studio.findUnique({
		where: { photographerId },
		select: { sectionsDraft: true },
	});
	if (!studio || studio.sectionsDraft === null) return null;
	return loadSiteBlocks(
		photographerId,
		normalizeDraftSections(studio.sectionsDraft),
	);
}
