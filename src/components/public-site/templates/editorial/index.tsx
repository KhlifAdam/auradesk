import { SiteSections } from "../../sections/site-sections";
import { SiteFooter } from "../../shared/site-footer";
import { getSiteSections } from "../../shared/site-helpers";
import { getNavLinks } from "../../shared/site-nav";
import type { TemplateProps } from "../types";
import { EditorialAbout } from "./about";
import { EditorialContact } from "./contact";
import { EditorialHeader } from "./header";
import { EditorialHero } from "./hero";
import { EditorialPortfolio } from "./portfolio";
import { EditorialServices } from "./services";

/** Editorial: magazine layouts, serif voice, every album told as a chapter. */
export async function EditorialTemplate({ site }: TemplateProps) {
	const links = await getNavLinks(getSiteSections(site), site.i18n.locale);

	return (
		<>
			<EditorialHeader site={site} links={links} />
			<EditorialHero site={site} />
			<SiteSections
				site={site}
				variant="editorial"
				builtIn={{
					portfolio: () => <EditorialPortfolio albums={site.albums} />,
					services: () => <EditorialServices site={site} />,
					about: () => <EditorialAbout site={site} />,
					contact: () => <EditorialContact site={site} />,
				}}
			/>
			<SiteFooter site={site} links={links} brandClassName="text-2xl italic" />
		</>
	);
}
