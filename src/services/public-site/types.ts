import type { MediaType } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import type {
	BUILT_IN_KINDS,
	FaqItem,
	StatItem,
} from "@/services/site-sections/schemas";
import type { SiteDesign, SocialKey } from "@/services/studio/schemas";

/** Lean media shape for rendering the public site. */
export interface SiteMedia {
	id: string;
	type: MediaType;
	url: string;
	alt: string;
	width: number;
	height: number;
}

export interface SiteStudio {
	/** Public address `/s/{slug}`; empty for demo data, which has no real site. */
	slug: string;
	name: string;
	tagline: string;
	bio: string;
	email: string;
	phone: string;
	city: string;
	country: string;
	socials: Record<SocialKey, string>;
	logo: SiteMedia | null;
	cover: SiteMedia | null;
	/** Photo of the photographer, used in "About" (demo only for now). */
	portrait: SiteMedia | null;
	bookingEnabled: boolean;
}

export interface SiteAlbum {
	id: string;
	title: string;
	slug: string;
	description: string;
	cover: SiteMedia | null;
	items: SiteMedia[];
}

export interface SitePackage {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	durationMinutes: number | null;
	deliverables: string[];
	cover: SiteMedia | null;
	featured: boolean;
}

/** One section below the hero, ready to render (only shown ones are kept). */
export type SiteBlock = { title: string } & (
	| { kind: (typeof BUILT_IN_KINDS)[number] }
	| {
			kind: "clients";
			items: { name: string; url: string; logo: SiteMedia }[];
	  }
	| {
			kind: "testimonials";
			items: {
				quote: string;
				author: string;
				role: string;
				photo: SiteMedia | null;
			}[];
	  }
	| { kind: "stats"; items: StatItem[] }
	| { kind: "faq"; items: FaqItem[] }
	| {
			kind: "showreel";
			/** A library video, or else an embedded YouTube / Vimeo player. */
			video: SiteMedia | null;
			embedUrl: string | null;
	  }
);

/** Everything a template needs; built from real or demo data. */
export interface SiteI18n {
	/** Language this render is in. */
	locale: Locale;
	locales: Locale[];
	defaultLocale: Locale;
}

export interface SiteData {
	studio: SiteStudio;
	design: SiteDesign;
	i18n: SiteI18n;
	albums: SiteAlbum[];
	packages: SitePackage[];
	/** The sections below the hero, in the photographer's order. */
	sections: SiteBlock[];
}
