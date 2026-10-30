import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { SiteData } from "@/services/public-site/types";
import { Reveal } from "../../shared/reveal";
import {
	formatLocation,
	getAboutImage,
	splitLead,
} from "../../shared/site-helpers";

/** Portrait beside a pull quote (the bio's first sentence) and the story. */
export async function EditorialAbout({ site }: { site: SiteData }) {
	const { studio, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.about",
	});
	const image = getAboutImage(site);
	const [lead, rest] = splitLead(studio.bio);
	const location = formatLocation(studio);

	return (
		<section id="about" className="px-6 py-24 md:px-12 md:py-32">
			<div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-12">
				<Reveal className="md:col-span-5">
					<div className="relative aspect-[4/5] overflow-hidden bg-[var(--s-border)]">
						{image && (
							<Image
								src={image.url}
								style={{ objectPosition: image.focus }}
								alt={image.alt}
								fill
								sizes="(min-width: 768px) 40vw, 100vw"
								className="object-cover"
							/>
						)}
					</div>
				</Reveal>
				<Reveal
					delay={0.15}
					className="flex flex-col gap-8 md:col-span-6 md:col-start-7"
				>
					<span className="site-accent-text text-xs font-semibold uppercase tracking-[0.3em]">
						{t("eyebrow")}
					</span>
					<blockquote className="site-heading relative text-3xl italic leading-snug md:text-4xl">
						<span
							aria-hidden
							className="site-accent-text absolute -left-6 -top-6 text-7xl not-italic leading-none md:-left-10"
						>
							“
						</span>
						{lead}
					</blockquote>
					{rest && (
						<p className="site-muted whitespace-pre-line text-lg leading-relaxed">
							{rest}
						</p>
					)}
					<div className="site-border flex items-center justify-between gap-4 border-t pt-6">
						<span className="site-heading text-2xl italic">{studio.name}</span>
						{location && (
							<span className="site-muted text-xs uppercase tracking-[0.25em]">
								{location}
							</span>
						)}
					</div>
				</Reveal>
			</div>
		</section>
	);
}
