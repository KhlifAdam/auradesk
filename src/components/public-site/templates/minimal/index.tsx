import { SiteSections } from "../../sections/site-sections";
import { SiteFooter } from "../../shared/site-footer";
import { getSiteSections } from "../../shared/site-helpers";
import { getNavLinks } from "../../shared/site-nav";
import type { TemplateProps } from "../types";
import { MinimalAbout } from "./about";
import { MinimalContact } from "./contact";
import { MinimalHeader } from "./header";
import { MinimalHero } from "./hero";
import { MinimalPortfolio } from "./portfolio";
import { MinimalServices } from "./services";

/** Minimal: airy, centered, the work speaks first. */
export async function MinimalTemplate({ site }: TemplateProps) {
	const links = await getNavLinks(getSiteSections(site), site.i18n.locale);

	return (
		<>
			<MinimalHeader site={site} links={links} />
			<MinimalHero site={site} />
			<SiteSections
				site={site}
				variant="minimal"
				builtIn={{
					portfolio: () => <MinimalPortfolio albums={site.albums} />,
					services: () => <MinimalServices site={site} />,
					about: () => <MinimalAbout site={site} />,
					contact: () => <MinimalContact site={site} />,
				}}
			/>
			<SiteFooter site={site} links={links} />
		</>
	);
}
