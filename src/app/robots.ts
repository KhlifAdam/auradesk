import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const base = env.BETTER_AUTH_URL.replace(/\/$/, "");

/** Public pages are open to crawlers; private spaces and shared galleries are not. */
export default function robots(): MetadataRoute.Robots {
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
