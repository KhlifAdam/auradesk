import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env } from "@/lib/env";

/**
 * Public pages are open to crawlers; private spaces and shared galleries are not.
 * Built per request: the site URL is not known at build time.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
	await connection();
	const base = env.BETTER_AUTH_URL.replace(/\/$/, "");
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/dashboard",
				"/portal",
				"/team",
				"/admin",
				"/preview",
				"/g/",
			],
		},
		sitemap: `${base}/sitemap.xml`,
	};
}
