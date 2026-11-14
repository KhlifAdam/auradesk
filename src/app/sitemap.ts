import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const base = env.BETTER_AUTH_URL.replace(/\/$/, "");

/** Marketing pages that search engines may list. */
const STATIC_PAGES = [
	{ path: "", priority: 1 },
	{ path: "/photographers", priority: 0.9 },
	{ path: "/client", priority: 0.6 },
	{ path: "/demo", priority: 0.5 },
	{ path: "/privacy", priority: 0.2 },
	{ path: "/terms", priority: 0.2 },
];

/** Every published studio site, in each of the languages it is offered in. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const studios = await db.studio.findMany({
		where: { published: true, photographer: { banned: { not: true } } },
		select: { slug: true, locales: true, updatedAt: true },
		orderBy: { updatedAt: "desc" },
	});

	return [
		...STATIC_PAGES.map(({ path, priority }) => ({
			url: `${base}${path}`,
			changeFrequency: "monthly" as const,
			priority,
		})),
		...studios.map((studio) => {
			const url = `${base}/s/${studio.slug}`;
			return {
				url,
				lastModified: studio.updatedAt,
				changeFrequency: "weekly" as const,
				priority: 0.8,
				alternates:
					studio.locales.length > 1
						? {
								languages: Object.fromEntries(
									studio.locales.map((locale) => [
										locale,
										`${url}?lang=${locale}`,
									]),
								),
							}
						: undefined,
			};
		}),
	];
}
