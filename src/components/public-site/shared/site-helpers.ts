import type {
	SiteBlock,
	SiteData,
	SiteMedia,
	SiteStudio,
} from "@/services/public-site/types";

/** Sections that get a link in the site's navigation. */
const NAV_SECTIONS = [
	"portfolio",
	"services",
	"about",
	"faq",
	"contact",
] as const;

export type SiteSection = (typeof NAV_SECTIONS)[number];

export const hasBio = (studio: SiteStudio) => studio.bio.trim().length > 0;

/** Whether a section has something to show; empty ones are left out. */
export function isShown(site: SiteData, block: SiteBlock): boolean {
	switch (block.kind) {
		case "portfolio":
			return site.albums.length > 0;
		case "services":
			return site.packages.length > 0;
		case "about":
			return hasBio(site.studio);
		case "contact":
			return true;
		case "showreel":
			return Boolean(block.video || block.embedUrl);
		default:
			return block.items.length > 0;
	}
}

/** The sections shown, in the photographer's order. */
export const getShownBlocks = (site: SiteData) =>
	site.sections.filter((block) => isShown(site, block));

const isNavSection = (kind: string): kind is SiteSection =>
	(NAV_SECTIONS as readonly string[]).includes(kind);

/** Sections with a nav link, in page order. */
export function getSiteSections(site: SiteData): SiteSection[] {
	return getShownBlocks(site)
		.map((block) => block.kind)
		.filter(isNavSection);
}

export const formatLocation = ({ city, country }: SiteStudio) =>
	[city, country].filter(Boolean).join(", ");

export function getHeroCover({ studio, albums }: SiteData): SiteMedia | null {
	return studio.cover ?? albums[0]?.cover ?? null;
}

/** Up to `count` distinct photos (excluding the hero) for collages. */
export function getFeaturedImages(site: SiteData, count: number): SiteMedia[] {
	const hero = getHeroCover(site)?.id;
	const picks: SiteMedia[] = [];
	// Take one photo per album first so collages show variety.
	for (const round of [0, 1, 2]) {
		for (const album of site.albums) {
			const media = album.items[round];
			if (media && media.type === "IMAGE" && media.id !== hero)
				picks.push(media);
			if (picks.length === count) return picks;
		}
	}
	return picks;
}

export function getAboutImage(site: SiteData): SiteMedia | null {
	return (
		site.studio.portrait ?? getFeaturedImages(site, 1)[0] ?? site.studio.cover
	);
}

/** First sentence of a text (for pull quotes), and the rest. */
export function splitLead(text: string): [string, string] {
	const match = text.match(/^([\s\S]+?[.!?])(\s+|$)/);
	if (!match) return [text, ""];
	return [match[1], text.slice(match[0].length).trim()];
}
