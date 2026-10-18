import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { siteFontVariables } from "@/lib/public-site/fonts";
import { cn } from "@/lib/utils";
import type { SiteData } from "@/services/public-site/types";
import { SiteShell } from "./shared/site-shell";
import { initialSiteTheme, siteStyle } from "./site-theme";
import { TEMPLATE_REGISTRY } from "./templates/registry";

/**
 * Renders a complete site from a SiteData object using the chosen template.
 * Used by the public `/s/{slug}` page and by the dashboard preview (real or
 * demo data), so both always look identical.
 *
 * The site gets its own language (independent of the dashboard's) and its own
 * light/dark state (independent of the dashboard theme).
 */
export async function SiteRenderer({ site }: { site: SiteData }) {
	const { design, i18n, studio } = site;
	const { palette, Component } = TEMPLATE_REGISTRY[design.template];
	const messages = await getMessages({ locale: i18n.locale });

	return (
		<NextIntlClientProvider
			locale={i18n.locale}
			// Client parts of the site only need the public-site strings.
			messages={{ PublicSite: messages.PublicSite }}
		>
			<SiteShell
				mode={design.themeMode}
				initialTheme={initialSiteTheme(design.themeMode)}
				storageKey={`auradesk-site-theme:${studio.name}`}
				studioSlug={studio.slug}
				lang={i18n.locale}
				style={siteStyle(design, palette)}
				className={cn(
					siteFontVariables,
					"site-bg site-fg site-body flex-1 scroll-smooth antialiased transition-colors duration-500",
				)}
			>
				<Component site={site} />
			</SiteShell>
		</NextIntlClientProvider>
	);
}
