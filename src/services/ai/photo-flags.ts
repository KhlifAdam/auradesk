import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { hashDistance, type PhotoMetrics } from "@/lib/ai/photo-metrics";
import {
	BLUR_THRESHOLD,
	BRIGHT_BRIGHTNESS,
	CLIPPED_SHARE,
	DARK_BRIGHTNESS,
	DUPLICATE_DISTANCE,
	type PhotoFlag,
} from "./options";

/** Quality flags of one photo, from its own measurements. */
export function qualityFlags(
	metrics: PhotoMetrics,
	eyesClosed: boolean | null,
): PhotoFlag[] {
	const flags: PhotoFlag[] = [];
	const dark = metrics.brightness < DARK_BRIGHTNESS;
	const bright =
		metrics.brightness > BRIGHT_BRIGHTNESS ||
		metrics.highlightsClipped > CLIPPED_SHARE;
	if (dark) flags.push("UNDEREXPOSED");
	if (bright) flags.push("OVEREXPOSED");
	// A dark frame has little contrast, so it would always read as blurry.
	if (!dark && metrics.sharpness < BLUR_THRESHOLD) flags.push("BLURRY");
	if (eyesClosed) flags.push("EYES_CLOSED");
	return flags;
}

interface Analysed {
	id: string;
	hash: string;
	sharpness: number;
	flags: string[];
}

/**
 * Groups near-identical photos and marks all but the sharpest of each group
 * as DUPLICATE. Returns the analyses whose flags changed.
 */
export function markDuplicates(rows: Analysed[]) {
	const duplicates = new Set<string>();
	const seen = new Set<string>();
	for (const row of rows) {
		if (seen.has(row.id)) continue;
		const group = rows.filter(
			(other) =>
				!seen.has(other.id) &&
				hashDistance(row.hash, other.hash) <= DUPLICATE_DISTANCE,
		);
		for (const member of group) seen.add(member.id);
		if (group.length < 2) continue;
		const best = group.reduce((a, b) => (b.sharpness > a.sharpness ? b : a));
		for (const member of group) if (member !== best) duplicates.add(member.id);
	}

	const changes: { id: string; flags: string[] }[] = [];
	for (const row of rows) {
		const had = row.flags.includes("DUPLICATE");
		const has = duplicates.has(row.id);
		if (had === has) continue;
		changes.push({
			id: row.id,
			flags: has
				? [...row.flags, "DUPLICATE"]
				: row.flags.filter((flag) => flag !== "DUPLICATE"),
		});
	}
	return changes;
}

/** Owner-only gallery filter: photos with at least one flag. */
export const flaggedItemWhere: Prisma.GalleryItemWhereInput = {
	analysis: { flags: { isEmpty: false } },
};
