import "server-only";

import { getTranslations } from "next-intl/server";
import { placeholderLogo } from "@/lib/public-site/placeholder-image";
import { publicUrl } from "@/lib/storage/r2";
import type { SiteDesign } from "@/services/studio/schemas";
import manifest from "./demo-images.json";
import type {
	SiteAlbum,
	SiteData,
	SiteI18n,
	SiteMedia,
	SitePackage,
} from "./types";

// Photos: CC0 Unsplash images hosted in our R2 bucket under demo/
type PhotoSet = keyof typeof manifest;

function photo(set: PhotoSet, index: number, alt: string): SiteMedia {
	const photos = manifest[set];
	const { key, width, height } = photos[index % photos.length];
	return { id: key, type: "IMAGE", url: publicUrl(key), alt, width, height };
}

const ALBUMS = [
	"weddings",
	"portraits",
	"events",
	"family",
	"brands",
	"travel",
] as const satisfies readonly PhotoSet[];

const PACKAGES = [
	{
		key: "essential",
		price: 450,
		minutes: 90,
		featured: false,
		cover: ["portraits", 1],
	},
	{
		key: "signature",
		price: 1200,
		minutes: 300,
		featured: true,
		cover: ["weddings", 3],
	},
	{
		key: "premium",
		price: 2400,
		minutes: 600,
		featured: false,
		cover: ["weddings", 8],
	},
	{
		key: "film",
		price: 1800,
		minutes: 240,
		featured: false,
		cover: ["events", 0],
	},
] as const;

/** Fully populated sample site: every section, all socials, real photos. */
export async function buildDemoSite(
	design: SiteDesign,
	i18n: SiteI18n,
): Promise<SiteData> {
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.demo",
	});

	const albums: SiteAlbum[] = ALBUMS.map((set) => {
		const title = t(`albums.${set}.title`);
		const items = manifest[set].map((_, i) => photo(set, i, title));
		return {
			id: set,
			title,
			slug: set,
			description: t(`albums.${set}.description`),
			cover: items[0],
			items,
		};
	});

	const packages: SitePackage[] = PACKAGES.map(
		({ key, price, minutes, featured, cover: [set, index] }) => ({
			id: key,
			name: t(`packages.${key}.name`),
			description: t(`packages.${key}.description`),
			price,
			currency: "EUR",
			durationMinutes: minutes,
			deliverables: [
				t(`packages.${key}.d1`),
				t(`packages.${key}.d2`),
				t(`packages.${key}.d3`),
				t(`packages.${key}.d4`),
			],
			cover: photo(set, index, t(`packages.${key}.name`)),
			featured,
		}),
	);

	const name = t("studioName");
	return {
		studio: {
			slug: "",
			name,
			tagline: t("tagline"),
			bio: t("bio"),
			email: "hello@atelier-lumiere.com",
			phone: "+33 6 12 34 56 78",
			city: t("city"),
			country: t("country"),
			socials: {
				instagram: "https://instagram.com/atelier.lumiere",
				facebook: "https://facebook.com/atelier.lumiere",
				youtube: "https://youtube.com/@atelier.lumiere",
				vimeo: "https://vimeo.com/atelierlumiere",
				tiktok: "https://tiktok.com/@atelier.lumiere",
				website: "https://atelier-lumiere.com",
			},
			logo: {
				id: "logo",
				type: "IMAGE",
				url: placeholderLogo("AL"),
				alt: name,
				width: 96,
				height: 96,
			},
			cover: photo("weddings", 0, name),
			portrait: photo("studio", 0, name),
			bookingEnabled: true,
		},
		design,
		i18n,
		albums,
		packages,
		sections: [
			{ kind: "portfolio", title: "" },
			{
				kind: "stats",
				title: "",
				items: (["s1", "s2", "s3", "s4"] as const).map((key) => ({
					value: t(`stats.${key}.value`),
					label: t(`stats.${key}.label`),
				})),
			},
			{ kind: "services", title: "" },
			{
				kind: "testimonials",
				title: "",
				items: (["t1", "t2", "t3"] as const).map((key, index) => ({
					quote: t(`testimonials.${key}.quote`),
					author: t(`testimonials.${key}.author`),
					role: t(`testimonials.${key}.role`),
					photo: photo("portraits", index, t(`testimonials.${key}.author`)),
				})),
			},
			{ kind: "about", title: "" },
			{
				kind: "faq",
				title: "",
				items: (["f1", "f2", "f3"] as const).map((key) => ({
					question: t(`faq.${key}.question`),
					answer: t(`faq.${key}.answer`),
				})),
			},
			{ kind: "contact", title: "" },
		],
	};
}
