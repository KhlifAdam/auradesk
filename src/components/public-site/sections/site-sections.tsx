import { Fragment, type ReactNode } from "react";
import type { SiteData } from "@/services/public-site/types";
import type { BUILT_IN_KINDS } from "@/services/site-sections/schemas";
import { getShownBlocks } from "../shared/site-helpers";
import { ClientsSection } from "./clients-section";
import { FaqSection } from "./faq-section";
import type { SiteVariant } from "./section-frame";
import { ShowreelSection } from "./showreel-section";
import { StatsSection } from "./stats-section";
import { TestimonialsSection } from "./testimonials-section";

/**
 * Every section below the hero, in the photographer's order. Each template
 * passes its own portfolio, services, about and contact; the other sections
 * are shared and take the template's look from `variant`.
 */
export function SiteSections({
	site,
	variant,
	builtIn,
}: {
	site: SiteData;
	variant: SiteVariant;
	builtIn: Record<(typeof BUILT_IN_KINDS)[number], () => ReactNode>;
}) {
	const { locale } = site.i18n;

	return getShownBlocks(site).map((block) => {
		const props = { locale, variant };
		switch (block.kind) {
			case "clients":
				return <ClientsSection key={block.kind} block={block} {...props} />;
			case "stats":
				return <StatsSection key={block.kind} block={block} {...props} />;
			case "testimonials":
				return (
					<TestimonialsSection key={block.kind} block={block} {...props} />
				);
			case "showreel":
				return <ShowreelSection key={block.kind} block={block} {...props} />;
			case "faq":
				return <FaqSection key={block.kind} block={block} {...props} />;
			default:
				return <Fragment key={block.kind}>{builtIn[block.kind]()}</Fragment>;
		}
	});
}
