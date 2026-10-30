import "server-only";

import { pickLocale, toLocales } from "@/i18n/config";
import { db } from "@/lib/db";
import { fetchSiteCore } from "./core";
import type { SiteData } from "./types";

/**
 * The site exactly as visitors see it, in the best language for this visitor.
 * Returns null when the photographer has no studio yet.
 */
export async function loadSiteData(
	photographerId: string,
	/** Requested languages in priority order (e.g. ?lang, cookie, browser). */
	localeCandidates: (string | undefined)[] = [],
): Promise<SiteData | null> {
	const core = await fetchSiteCore(photographerId);
	if (!core) return null;

	const locales = toLocales(core.locales);
	const defaultLocale = pickLocale([core.defaultLocale], locales, locales[0]);
	const { locales: _locales, defaultLocale: _default, ...site } = core;

	return {
		...site,
		i18n: {
			locale: pickLocale(localeCandidates, locales, defaultLocale),
			locales,
			defaultLocale,
		},
	};
}

export type PublicSiteResult =
	| { status: "missing" }
	| { status: "draft"; name: string }
	/** The owner's account is suspended: the site is offline meanwhile. */
	| { status: "suspended"; name: string }
	| { status: "live"; site: SiteData };

export async function getPublicSite(
	slug: string,
	localeCandidates: (string | undefined)[] = [],
): Promise<PublicSiteResult> {
	const studio = await db.studio.findUnique({
		where: { slug },
		select: {
			photographerId: true,
			published: true,
			name: true,
			photographer: { select: { banned: true } },
		},
	});
	if (!studio) return { status: "missing" };
	if (studio.photographer.banned)
		return { status: "suspended", name: studio.name };
	if (!studio.published) return { status: "draft", name: studio.name };

	const site = await loadSiteData(studio.photographerId, localeCandidates);
	return site ? { status: "live", site } : { status: "missing" };
}

/** True when the real site has enough content to be worth previewing. */
export function hasSiteContent(site: SiteData | null) {
	return Boolean(site && (site.albums.length > 0 || site.packages.length > 0));
}
