import {
	SECTION_KINDS,
	type SectionKind,
	type SiteSectionConfig,
	sectionSchema,
} from "./schemas";

/** A section as it starts: shown, default heading, no content yet. */
export function defaultSection(kind: SectionKind): SiteSectionConfig {
	const base = { enabled: true, title: "" };
	switch (kind) {
		case "clients":
		case "testimonials":
		case "stats":
		case "faq":
			return { kind, ...base, items: [] } as SiteSectionConfig;
		case "showreel":
			return { kind, ...base, mediaId: null, videoUrl: "" };
		default:
			return { kind, ...base };
	}
}

/**
 * Turns whatever is stored into a complete page: invalid or repeated entries
 * are dropped, and missing kinds are put back at their default place (after
 * the kind that comes before them by default). Old sites, stored as `[]`,
 * get the default layout.
 */
export function normalizeSections(raw: unknown): SiteSectionConfig[] {
	const sections: SiteSectionConfig[] = [];
	for (const entry of Array.isArray(raw) ? raw : []) {
		const parsed = sectionSchema.safeParse(entry);
		if (
			parsed.success &&
			!sections.some((section) => section.kind === parsed.data.kind)
		)
			sections.push(parsed.data);
	}

	SECTION_KINDS.forEach((kind, index) => {
		if (sections.some((section) => section.kind === kind)) return;
		const previous = SECTION_KINDS.slice(0, index)
			.reverse()
			.map((before) => sections.findIndex((s) => s.kind === before))
			.find((at) => at !== -1);
		sections.splice(
			previous === undefined ? 0 : previous + 1,
			0,
			defaultSection(kind),
		);
	});
	return sections;
}

const isValid = (entry: unknown) => sectionSchema.safeParse(entry).success;

/**
 * Keeps as much of a half-edited section as is valid: a bad heading or video
 * link is blanked and unfinished items are left out, instead of losing the
 * whole section.
 */
function salvageSection(raw: unknown): unknown {
	if (!raw || typeof raw !== "object") return raw;
	const { items, ...rest } = raw as Record<string, unknown>;
	const entry: Record<string, unknown> = Array.isArray(items)
		? { ...rest, items: [] }
		: rest;
	const parsed = sectionSchema.safeParse(entry);
	for (const issue of parsed.error?.issues ?? []) {
		const field = issue.path[0];
		if (field === "title" || field === "videoUrl") entry[field] = "";
	}
	if (!Array.isArray(items)) return entry;
	return {
		...entry,
		items: items.filter((item) => isValid({ ...entry, items: [item] })),
	};
}

/** Like `normalizeSections`, for an unsaved draft shown in the live preview. */
export function normalizeDraftSections(raw: unknown): SiteSectionConfig[] {
	return normalizeSections(Array.isArray(raw) ? raw.map(salvageSection) : raw);
}

/** Every media id the sections point to (logos, photos, video). */
export function sectionMediaIds(sections: SiteSectionConfig[]): string[] {
	const ids = sections.flatMap((section) => {
		switch (section.kind) {
			case "clients":
				return section.items.map((item) => item.logoId);
			case "testimonials":
				return section.items.map((item) => item.photoId);
			case "showreel":
				return [section.mediaId];
			default:
				return [];
		}
	});
	return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
