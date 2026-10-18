import { z } from "zod";
import { LOCALES } from "@/i18n/config";
import {
	optionalEmail,
	optionalText,
	optionalUrl,
	requiredText,
	slugSchema,
} from "@/services/shared/schemas";

export const SOCIAL_KEYS = [
	"instagram",
	"facebook",
	"youtube",
	"vimeo",
	"tiktok",
	"website",
] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const socialsSchema = z.object(
	Object.fromEntries(SOCIAL_KEYS.map((key) => [key, optionalUrl])) as Record<
		SocialKey,
		typeof optionalUrl
	>,
);

/** Reserved slugs that would collide with app routes or look official. */
const RESERVED_SLUGS = new Set([
	"admin",
	"api",
	"dashboard",
	"login",
	"register",
	"auradesk",
	// The app's former name: still nobody's studio address.
	"lumodesk",
	"settings",
	"www",
]);

export const studioSlugSchema = slugSchema.refine(
	(slug) => !RESERVED_SLUGS.has(slug),
	"slugReserved",
);

export const createStudioSchema = z.object({
	name: requiredText(80),
	slug: studioSlugSchema,
});

export const studioProfileSchema = z.object({
	name: requiredText(80),
	slug: studioSlugSchema,
	tagline: optionalText(140),
	bio: optionalText(2000),
	email: optionalEmail,
	phone: optionalText(30),
	city: optionalText(80),
	country: optionalText(80),
	socials: socialsSchema,
	logoMediaId: z.string().nullable(),
	coverMediaId: z.string().nullable(),
	published: z.boolean(),
	bookingEnabled: z.boolean(),
});

export type CreateStudioValues = z.infer<typeof createStudioSchema>;
export type StudioProfileValues = z.infer<typeof studioProfileSchema>;

export const SITE_TEMPLATES = ["MINIMAL", "EDITORIAL", "BOLD"] as const;
export const FONT_PAIRS = ["MODERN", "CLASSIC", "ELEGANT"] as const;
export const THEME_MODES = ["LIGHT", "DARK", "BOTH"] as const;

/** How the public site looks. */
export const designSchema = z.object({
	template: z.enum(SITE_TEMPLATES),
	accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "invalidColor"),
	fontPair: z.enum(FONT_PAIRS),
	themeMode: z.enum(THEME_MODES),
});

/** Which languages the public site is offered in. */
export const languagesShape = {
	locales: z.array(z.enum(LOCALES)).min(1, "pickLanguage"),
	defaultLocale: z.enum(LOCALES),
};

/** Everything edited on the Appearance page. */
export const appearanceSchema = designSchema
	.extend(languagesShape)
	.refine((value) => value.locales.includes(value.defaultLocale), {
		message: "defaultLanguageMissing",
		path: ["defaultLocale"],
	});

export type SiteDesign = z.infer<typeof designSchema>;
export type AppearanceValues = z.infer<typeof appearanceSchema>;
