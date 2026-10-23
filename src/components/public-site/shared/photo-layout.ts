import type { SiteMedia } from "@/services/public-site/types";

export type Orientation = "portrait" | "landscape" | "square";

/** Near-square photos (within ~15%) count as square. */
export function orientationOf({
	width,
	height,
}: Pick<SiteMedia, "width" | "height">): Orientation {
	const ratio = width / height;
	if (ratio > 1.15) return "landscape";
	if (ratio < 0.87) return "portrait";
	return "square";
}

/** True when most of these photos are portraits. */
export function mostlyPortrait(items: SiteMedia[]) {
	const portraits = items.filter((m) => orientationOf(m) === "portrait");
	return portraits.length * 2 > items.length;
}
