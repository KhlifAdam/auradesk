import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { SiteData } from "@/services/public-site/types";
import { Reveal } from "../../shared/reveal";
import { formatLocation, getHeroCover } from "../../shared/site-helpers";

/** Full-screen photo with a slow zoom, giant title, then a marquee of albums. */
export async function BoldHero({ site }: { site: SiteData }) {
	const { studio, albums, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.hero",
	});
	const cover = getHeroCover(site);
	const location = formatLocation(studio);
	// Repeated so the band is wider than the screen; the animation shifts by 50%.
	const marquee = [0, 1, 2, 3].flatMap((round) =>
		albums.map((album) => ({
			key: `${round}-${album.id}`,
			title: album.title,
		})),
	);

	return (
		<>
			<section
				id="top"
				className="relative flex min-h-[100svh] items-end overflow-hidden bg-black text-white"
			>
				{cover && (
					<Image
						src={cover.url}
						alt={cover.alt}
						fill
						loading="eager"
						fetchPriority="high"
						sizes="100vw"
						className="animate-kenburns object-cover opacity-80"
					/>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
				<div className="relative w-full px-6 pb-12 md:px-12 md:pb-16">
					<Reveal className="flex flex-col gap-8">
						{location && (
							<span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
								<span className="h-0.5 w-12 bg-[var(--s-accent)]" />
								{location}
							</span>
						)}
						<h1 className="site-heading text-[15vw] font-bold uppercase leading-[0.82] tracking-tighter md:text-[10vw]">
							{studio.name}
						</h1>
						<div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
							{studio.tagline && (
								<p className="max-w-md text-lg leading-relaxed text-white/75">
									{studio.tagline}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-3">
								{studio.bookingEnabled && (
									<a
										href="#contact"
										className="site-accent-bg inline-flex h-12 items-center px-8 text-sm font-bold uppercase tracking-widest transition-transform hover:-translate-y-0.5"
									>
										{t("cta")}
									</a>
								)}
								{albums.length > 0 && (
									<a
										href="#portfolio"
										className="inline-flex h-12 items-center gap-2 border border-white/30 px-6 text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-white hover:text-black"
									>
										{t("viewWork")}
										<ArrowDown className="h-4 w-4" />
									</a>
								)}
							</div>
						</div>
					</Reveal>
				</div>
			</section>

			{marquee.length > 0 && (
				<div className="site-accent-bg overflow-hidden py-4" aria-hidden>
					<div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
						{marquee.map(({ key, title }) => (
							<span
								key={key}
								className="site-heading flex items-center gap-10 text-2xl font-bold uppercase tracking-tight md:text-3xl"
							>
								{title}
								<span className="text-base">✦</span>
							</span>
						))}
					</div>
				</div>
			)}
		</>
	);
}
