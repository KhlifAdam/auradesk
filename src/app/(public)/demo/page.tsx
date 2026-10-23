import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { DemoBar } from "@/components/landing/demo-bar";
import { SiteRenderer } from "@/components/public-site/site-renderer";
import { LOCALES } from "@/i18n/config";
import { BRAND_NAME } from "@/lib/brand";
import { buildDemoSite } from "@/services/public-site/demo";
import { SITE_TEMPLATES } from "@/services/studio/schemas";

const paramsSchema = z.object({
	template: z.enum(SITE_TEMPLATES).catch("MINIMAL"),
	/** The site's own language switch sets `?lang`. */
	lang: z.enum(LOCALES).optional().catch(undefined),
});

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Landing.demo");
	return { title: `${t("metaTitle")} | ${BRAND_NAME}` };
}

/**
 * A sample studio site with real photos, built by the same renderer as every
 * photographer's site: what visitors of the landing page can expect.
 */
export default async function DemoPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { template, lang } = paramsSchema.parse(await searchParams);
	const locale = lang ?? (await getLocale());
	const site = await buildDemoSite(
		{ template, accentColor: "#c8a96e", fontPair: "MODERN", themeMode: "BOTH" },
		{ locale, locales: [...LOCALES], defaultLocale: locale },
	);

	return (
		<>
			<SiteRenderer site={site} />
			<DemoBar template={template} />
		</>
	);
}
