import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { SiteData } from "@/services/public-site/types";
import { Reveal } from "../../shared/reveal";
import {
	formatLocation,
	getFeaturedImages,
	getHeroCover,
} from "../../shared/site-helpers";

/** Magazine cover: oversized serif title beside a tall photo with an inset frame. */
export async function EditorialHero({ site }: { site: SiteData }) {
	const { studio, albums, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.hero",
	});
	const cover = getHeroCover(site);
	const [inset] = getFeaturedImages(site, 1);
	const location = formatLocation(studio);

	return (
		<section id="top" className="px-6 pb-20 pt-10 md:px-12 md:pb-28 md:pt-16">
			<div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-12">
				<Reveal className="flex flex-col gap-7 md:col-span-5">
					{location && (
						<span className="site-muted flex items-center gap-3 text-xs uppercase tracking-[0.3em]">
							<span className="h-px w-10 bg-[var(--s-accent)]" />
							{location}
						</span>
					)}
					<h1 className="site-heading text-6xl leading-[0.92] tracking-tight md:text-7xl lg:text-8xl">
						{studio.name}
					</h1>
					{studio.tagline && (
						<p className="site-heading site-muted max-w-md text-xl italic leading-relaxed md:text-2xl">
							{studio.tagline}
						</p>
					)}
					<div className="flex flex-wrap items-center gap-6 pt-2">
						{studio.bookingEnabled && (
							<a
								href="#contact"
								className="site-accent-bg inline-flex h-12 items-center rounded-full px-8 text-sm font-semibold transition-opacity hover:opacity-90"
							>
								{t("cta")}
							</a>
						)}
						{albums.length > 0 && (
							<a
								href="#portfolio"
								className="group inline-flex items-center gap-2 text-sm font-medium underline decoration-[var(--s-border)] underline-offset-8 transition-colors hover:decoration-[var(--s-accent)]"
							>
								{t("viewWork")}
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</a>
						)}
					</div>
				</Reveal>

				<Reveal delay={0.15} className="relative md:col-span-7">
					<div className="relative aspect-[4/5] overflow-hidden bg-[var(--s-border)] md:aspect-auto md:h-[78vh]">
						{cover && (
							<Image
								src={cover.url}
								alt={cover.alt}
								fill
								loading="eager"
								fetchPriority="high"
								sizes="(min-width: 768px) 58vw, 100vw"
								className="object-cover"
							/>
						)}
					</div>
					{inset && (
						<div className="absolute -bottom-10 -left-6 hidden w-[34%] border-[10px] border-[var(--s-bg)] shadow-2xl shadow-black/20 md:block lg:-left-16">
							<div className="relative aspect-[3/4]">
								<Image
									src={inset.url}
									alt={inset.alt}
									fill
									sizes="22vw"
									className="object-cover"
								/>
							</div>
						</div>
					)}
				</Reveal>
			</div>
		</section>
	);
}
