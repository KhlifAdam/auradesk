import { SiteSections } from "../../sections/site-sections";
import { SiteFooter } from "../../shared/site-footer";
import { getSiteSections } from "../../shared/site-helpers";
import { getNavLinks } from "../../shared/site-nav";
import type { TemplateProps } from "../types";
import { BoldAbout } from "./about";
import { BoldContact } from "./contact";
import { BoldHeader } from "./header";
import { BoldHero } from "./hero";
import { BoldPortfolio } from "./portfolio";
import { BoldServices } from "./services";

/** Bold: full-bleed imagery, oversized type, high contrast. */
export async function BoldTemplate({ site }: TemplateProps) {
	const links = await getNavLinks(getSiteSections(site), site.i18n.locale);

	return (
		<>
			<BoldHeader site={site} links={links} />
			<BoldHero site={site} />
			<SiteSections
				site={site}
				variant="bold"
				builtIn={{
					portfolio: () => <BoldPortfolio albums={site.albums} />,
					services: () => <BoldServices site={site} />,
					about: () => <BoldAbout site={site} />,
					contact: () => <BoldContact site={site} />,
				}}
			/>
			<SiteFooter
				site={site}
				links={links}
				brandClassName="font-bold uppercase tracking-[0.2em]"
			/>
		</>
	);
}
