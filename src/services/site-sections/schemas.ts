import { z } from "zod";
import {
	idSchema,
	optionalText,
	optionalUrl,
	requiredText,
} from "@/services/shared/schemas";
import { toVideoEmbed } from "./video-embed";

/** Every section of the public site below the hero, in their default order. */
export const SECTION_KINDS = [
	"portfolio",
	"clients",
	"services",
	"stats",
	"testimonials",
	"showreel",
	"about",
	"faq",
	"contact",
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

/** Sections that only hold a heading and a switch; their content lives elsewhere. */
export const BUILT_IN_KINDS = [
	"portfolio",
	"services",
	"about",
	"contact",
] as const satisfies SectionKind[];

/** Content limits: these are short, curated lists shown in full on the site. */
export const SECTION_LIMITS = {
	clients: 40,
	testimonials: 20,
	stats: 8,
	faq: 30,
} as const;

const base = {
	enabled: z.boolean(),
	/** Overrides the default heading; empty keeps it. */
	title: optionalText(80),
};

const clientItem = z.object({
	name: requiredText(80),
	url: optionalUrl,
	// Nullable while the form is being filled; required once saved.
	logoId: idSchema.nullable().refine((id) => Boolean(id), "required"),
});

const testimonialItem = z.object({
	quote: requiredText(600),
	author: requiredText(80),
	role: optionalText(80),
	photoId: idSchema.nullable(),
});

const statItem = z.object({
	value: requiredText(12),
	label: requiredText(60),
});

const faqItem = z.object({
	question: requiredText(200),
	answer: requiredText(1500),
});

const builtIn = z.object({ kind: z.enum(BUILT_IN_KINDS), ...base });

export const sectionSchema = z.discriminatedUnion("kind", [
	builtIn,
	z.object({
		kind: z.literal("clients"),
		...base,
		items: z.array(clientItem).max(SECTION_LIMITS.clients),
	}),
	z.object({
		kind: z.literal("testimonials"),
		...base,
		items: z.array(testimonialItem).max(SECTION_LIMITS.testimonials),
	}),
	z.object({
		kind: z.literal("stats"),
		...base,
		items: z.array(statItem).max(SECTION_LIMITS.stats),
	}),
	z.object({
		kind: z.literal("faq"),
		...base,
		items: z.array(faqItem).max(SECTION_LIMITS.faq),
	}),
	z.object({
		kind: z.literal("showreel"),
		...base,
		/** A video from the media library… */
		mediaId: idSchema.nullable(),
		/** …or a YouTube / Vimeo link. */
		videoUrl: optionalUrl.refine(
			(url) => url === "" || toVideoEmbed(url) !== null,
			"invalidVideoUrl",
		),
	}),
]);

/** The whole page: each kind exactly once, in the order shown. */
export const sectionsSchema = z
	.array(sectionSchema)
	.length(SECTION_KINDS.length)
	.refine(
		(sections) =>
			new Set(sections.map((section) => section.kind)).size ===
			SECTION_KINDS.length,
		"invalidInput",
	);

export const saveSectionsSchema = z.object({ sections: sectionsSchema });

export type SiteSectionConfig = z.infer<typeof sectionSchema>;
export type SectionsValues = z.infer<typeof saveSectionsSchema>;
export type ClientItem = z.infer<typeof clientItem>;
export type TestimonialItem = z.infer<typeof testimonialItem>;
export type StatItem = z.infer<typeof statItem>;
export type FaqItem = z.infer<typeof faqItem>;
