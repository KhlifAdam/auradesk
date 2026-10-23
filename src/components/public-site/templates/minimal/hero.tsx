import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { SiteData, SiteMedia } from "@/services/public-site/types";
import { Reveal } from "../../shared/reveal";
import {
	formatLocation,
	getFeaturedImages,
	getHeroCover,
} from "../../shared/site-helpers";

function Frame({
	media,
	className,
	eager,
	sizes,
}: {
	media: SiteMedia | undefined | null;
	className: string;
	/** The main photo: fetched before the others. */
	eager?: boolean;
	sizes: string;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-2xl bg-[var(--s-border)]",
				className,
			)}
		>
			{media && (
				<Image
					src={media.url}
					alt={media.alt}
					fill
					// The collage is the top of the page: never wait to load it.
					loading="eager"
					fetchPriority={eager ? "high" : "auto"}
					sizes={sizes}
					className="object-cover"
				/>
			)}
		</div>
	);
}

/** Centered statement over a three-photo collage. */
export async function MinimalHero({ site }: { site: SiteData }) {
	const { studio, albums, i18n } = site;
	const t = await getTranslations({
		locale: i18n.locale,
		namespace: "PublicSite.hero",
	});
	const location = formatLocation(studio);
	const [left, right] = getFeaturedImages(site, 2);

	return (
		<section
			id="top"
			className="relative overflow-hidden px-6 pb-20 pt-12 md:px-8 md:pt-20"
		>
			<Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
				{studio.bookingEnabled && (
					<span className="site-border site-card inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--s-accent)] opacity-60" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--s-accent)]" />
						</span>
						{t("availability")}
					</span>
				)}
				<h1 className="site-heading text-5xl leading-[1.02] tracking-tight md:text-7xl">
					{studio.name}
				</h1>
				{studio.tagline && (
					<p className="site-muted max-w-xl text-lg leading-relaxed">
						{studio.tagline}
					</p>
				)}
				<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
					{studio.bookingEnabled && (
						<a
							href="#contact"
							className="site-accent-bg inline-flex h-12 items-center rounded-full px-8 text-sm font-semibold shadow-lg shadow-black/5 transition-transform hover:-translate-y-0.5"
						>
							{t("cta")}
						</a>
					)}
					{albums.length > 0 && (
						<a
							href="#portfolio"
							className="site-border inline-flex h-12 items-center gap-2 rounded-full border px-7 text-sm font-medium transition-colors hover:border-[var(--s-fg)]"
						>
							{t("viewWork")}
							<ArrowDown className="h-4 w-4" />
						</a>
					)}
				</div>
				{location && (
					<span className="site-muted text-xs uppercase tracking-[0.3em]">
						{location}
					</span>
				)}
			</Reveal>

			<div className="mx-auto mt-16 grid max-w-6xl grid-cols-12 items-start gap-4 md:gap-6">
				{/* Side photos come from the albums: without them, no empty frames,
				    and the cover stays centred. */}
				{left && (
					<Reveal delay={0.25} className="col-span-3 mt-24 hidden md:block">
						<Frame media={left} className="aspect-[3/4]" sizes="25vw" />
					</Reveal>
				)}
				<Reveal
					delay={0.1}
					className={cn("col-span-12 md:col-span-6", !left && "md:col-start-4")}
				>
					<Frame
						media={getHeroCover(site)}
						className="aspect-[4/5] md:aspect-[4/5]"
						eager
						sizes="(min-width: 768px) 50vw, 100vw"
					/>
				</Reveal>
				{right && (
					<Reveal delay={0.35} className="col-span-3 mt-12 hidden md:block">
						<Frame media={right} className="aspect-[3/4]" sizes="25vw" />
					</Reveal>
				)}
			</div>
		</section>
	);
}
