import type { SiteSectionConfig } from "@/services/site-sections/schemas";
import { toVideoEmbed } from "@/services/site-sections/video-embed";
import type { SiteBlock, SiteMedia } from "./types";

/**
 * The enabled sections, in order, with their media resolved. Entries whose
 * media was deleted from the library are dropped (a logo) or lose it (a
 * testimonial photo).
 */
export function resolveSiteSections(
	sections: SiteSectionConfig[],
	media: Map<string, SiteMedia>,
): SiteBlock[] {
	const find = (id: string | null) => (id ? (media.get(id) ?? null) : null);

	return sections
		.filter((section) => section.enabled)
		.map((section): SiteBlock => {
			const { title } = section;
			switch (section.kind) {
				case "clients":
					return {
						kind: "clients",
						title,
						items: section.items.flatMap((item) => {
							const logo = find(item.logoId);
							return logo ? [{ name: item.name, url: item.url, logo }] : [];
						}),
					};
				case "testimonials":
					return {
						kind: "testimonials",
						title,
						items: section.items.map((item) => ({
							quote: item.quote,
							author: item.author,
							role: item.role,
							photo: find(item.photoId),
						})),
					};
				case "stats":
				case "faq":
					return {
						kind: section.kind,
						title,
						items: section.items,
					} as SiteBlock;
				case "showreel": {
					const video = find(section.mediaId);
					return {
						kind: "showreel",
						title,
						video: video?.type === "VIDEO" ? video : null,
						embedUrl: section.videoUrl ? toVideoEmbed(section.videoUrl) : null,
					};
				}
				default:
					return { kind: section.kind, title };
			}
		});
}
