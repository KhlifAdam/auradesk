import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { SiteData } from "@/services/public-site/types";
import { Reveal } from "../../shared/reveal";
import { formatLocation, getAboutImage } from "../../shared/site-helpers";

/** Round portrait, the story in one centered column, a signature. */
export async function MinimalAbout({ site }: { site: SiteData }) {
	const { studio, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.about",
	});
	const image = getAboutImage(site);
	const location = formatLocation(studio);

	return (
		<section id="about" className="px-6 py-24 md:px-8 md:py-32">
			<Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-7 text-center">
				{image && (
					<div className="relative h-36 w-36 overflow-hidden rounded-full ring-4 ring-[var(--s-card)] ring-offset-4 ring-offset-[var(--s-border)]">
						<Image
							src={image.url}
							style={{ objectPosition: image.focus }}
							alt={image.alt}
							fill
							sizes="144px"
							className="object-cover"
						/>
					</div>
				)}
				<span className="site-accent-text text-xs font-semibold uppercase tracking-[0.3em]">
					{t("eyebrow")}
				</span>
				<h2 className="site-heading text-4xl tracking-tight md:text-5xl">
					{t("title")}
				</h2>
				<p className="site-muted whitespace-pre-line text-lg leading-loose">
					{studio.bio}
				</p>
				<div className="flex flex-col items-center gap-1 pt-2">
					<span className="site-heading text-2xl italic">{studio.name}</span>
					{location && (
						<span className="site-muted text-xs uppercase tracking-[0.25em]">
							{location}
						</span>
					)}
				</div>
			</Reveal>
		</section>
	);
}
