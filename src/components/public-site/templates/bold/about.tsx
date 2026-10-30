import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { SiteData } from "@/services/public-site/types";
import { Reveal } from "../../shared/reveal";
import {
	formatLocation,
	getAboutImage,
	getFeaturedImages,
	splitLead,
} from "../../shared/site-helpers";

/** The bio as a manifesto: first sentence in the accent, then a photo strip. */
export async function BoldAbout({ site }: { site: SiteData }) {
	const { studio, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.about",
	});
	const [lead, rest] = splitLead(studio.bio);
	const location = formatLocation(studio);
	const strip = [
		getAboutImage(site),
		...getFeaturedImages(site, 4).slice(2),
	].filter((media) => media !== null);

	return (
		<section id="about" className="px-6 py-24 md:px-12 md:py-32">
			<Reveal className="flex max-w-6xl flex-col gap-10">
				<span className="site-accent-text text-xs font-bold uppercase tracking-[0.35em]">
					{t("eyebrow")}
				</span>
				<p className="site-heading text-3xl font-bold leading-[1.1] tracking-tight md:text-6xl">
					<span className="site-accent-text">{lead}</span> {rest}
				</p>
				{location && (
					<span className="site-muted text-xs font-bold uppercase tracking-[0.35em]">
						— {studio.name}, {location}
					</span>
				)}
			</Reveal>

			{strip.length > 0 && (
				<div className="mt-16 grid grid-cols-3 gap-2">
					{strip.map((media, index) => (
						<Reveal key={media.id} delay={index * 0.1}>
							<div className="group relative aspect-[3/4] overflow-hidden bg-[var(--s-border)]">
								<Image
									src={media.url}
									style={{ objectPosition: media.focus }}
									alt={media.alt}
									fill
									sizes="33vw"
									className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
								/>
							</div>
						</Reveal>
					))}
				</div>
			)}
		</section>
	);
}
