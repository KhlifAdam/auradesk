import "server-only";

import { unstable_cache } from "next/cache";
import type { Media } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { PUBLIC_SITE_TAG } from "@/lib/public-site/cache";
import { MAX_PACKAGES } from "@/services/packages/schemas";
import { MAX_ALBUMS } from "@/services/portfolio/schemas";
import { normalizeSections } from "@/services/site-sections/normalize";
import { toSocials } from "@/services/studio/queries";
import { loadSiteBlocks } from "./sections";
import { toSiteMedia } from "./site-media";
import type { SiteAlbum, SiteData, SitePackage } from "./types";

const orNull = (media: Media | null) => (media ? toSiteMedia(media) : null);

/** Everything on a site except the visitor's language (which is per request). */
export interface SiteCore extends Omit<SiteData, "i18n"> {
	locales: string[];
	defaultLocale: string;
}

/**
 * The heavy part of a public site, cached across visitors. Holds only plain
 * JSON values (no Dates or Decimals), so it survives the cache round trip.
 * Cleared by `revalidatePublicSites()` after any change visible on a site.
 */
export const fetchSiteCore = unstable_cache(
	async (photographerId: string): Promise<SiteCore | null> => {
		const studio = await db.studio.findUnique({
			where: { photographerId },
			include: { logo: true, cover: true },
		});
		if (!studio) return null;

		const sections = normalizeSections(studio.sections);
		const [albums, packages, blocks] = await Promise.all([
			db.album.findMany({
				where: { photographerId, published: true },
				orderBy: { position: "asc" },
				take: MAX_ALBUMS,
				include: {
					cover: true,
					items: { orderBy: { position: "asc" }, include: { media: true } },
				},
			}),
			db.package.findMany({
				where: { photographerId, active: true },
				orderBy: { position: "asc" },
				take: MAX_PACKAGES,
				include: { cover: true },
			}),
			loadSiteBlocks(photographerId, sections),
		]);

		const siteAlbums: SiteAlbum[] = albums
			.filter((album) => album.items.length > 0)
			.map((album) => ({
				id: album.id,
				title: album.title,
				slug: album.slug,
				description: album.description ?? "",
				cover: orNull(album.cover) ?? toSiteMedia(album.items[0].media),
				items: album.items.map((item) => toSiteMedia(item.media)),
			}));

		const sitePackages: SitePackage[] = packages.map((pkg) => ({
			id: pkg.id,
			name: pkg.name,
			description: pkg.description ?? "",
			price: pkg.price.toNumber(),
			currency: pkg.currency,
			durationMinutes: pkg.durationMinutes,
			deliverables: pkg.deliverables,
			cover: orNull(pkg.cover),
			featured: pkg.featured,
		}));

		return {
			studio: {
				slug: studio.slug,
				name: studio.name,
				tagline: studio.tagline ?? "",
				bio: studio.bio ?? "",
				email: studio.email ?? "",
				phone: studio.phone ?? "",
				city: studio.city ?? "",
				country: studio.country ?? "",
				socials: toSocials(studio.socials),
				logo: orNull(studio.logo),
				cover: orNull(studio.cover),
				portrait: null,
				bookingEnabled: studio.bookingEnabled,
			},
			design: {
				template: studio.template,
				accentColor: studio.accentColor,
				fontPair: studio.fontPair,
				themeMode: studio.themeMode,
			},
			albums: siteAlbums,
			packages: sitePackages,
			sections: blocks,
			locales: studio.locales,
			defaultLocale: studio.defaultLocale,
		};
	},
	// Bump when the cached shape changes, so old entries are never reused.
	["public-site-core-v3"],
	{ tags: [PUBLIC_SITE_TAG] },
);
