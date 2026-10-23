"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SiteAlbum } from "@/services/public-site/types";
import { GalleryTile } from "../../shared/gallery-tile";
import { Lightbox } from "../../shared/lightbox";
import { mostlyPortrait } from "../../shared/photo-layout";
import { Reveal } from "../../shared/reveal";

// Five-photo spreads on a 6-column grid; odd chapters mirror the layout.
const SPREAD = [
	"col-span-2 row-span-2 md:col-span-4 md:row-span-3",
	"md:col-span-2 md:row-span-2",
	"md:col-span-2",
	"md:col-span-3 md:row-span-2",
	"md:col-span-3 md:row-span-2",
];
const MIRRORED = [
	"col-span-2 row-span-2 md:col-span-2 md:row-span-2",
	"md:col-span-4 md:row-span-3",
	"md:col-span-2",
	"md:col-span-3 md:row-span-2",
	"md:col-span-3 md:row-span-2",
];

// For albums of mostly portraits: two tall frames beside two smaller ones.
const PORTRAIT_SPREAD = [
	"row-span-2 md:col-span-2 md:row-span-4",
	"row-span-2 md:col-span-2 md:row-span-4",
	"md:col-span-2 md:row-span-2",
	"md:col-span-2 md:row-span-2",
];
const PORTRAIT_MIRRORED = [
	"md:col-span-2 md:row-span-2",
	"row-span-2 md:col-span-2 md:row-span-4",
	"row-span-2 md:col-span-2 md:row-span-4",
	"md:col-span-2 md:row-span-2",
];

/** The spread that suits the album's photos, mirrored on odd chapters. */
function spreadFor(album: SiteAlbum, index: number) {
	const mirrored = index % 2 === 1;
	if (mostlyPortrait(album.items.slice(0, SPREAD.length)))
		return mirrored ? PORTRAIT_MIRRORED : PORTRAIT_SPREAD;
	return mirrored ? MIRRORED : SPREAD;
}

/** Each album is a numbered chapter with an asymmetric photo spread. */
export function EditorialPortfolio({ albums }: { albums: SiteAlbum[] }) {
	const t = useTranslations("PublicSite.portfolio");
	const [open, setOpen] = useState<{ album: number; index: number } | null>(
		null,
	);

	return (
		<section id="portfolio" className="px-6 py-24 md:px-12 md:py-32">
			<div className="mx-auto flex max-w-7xl flex-col gap-24">
				<Reveal className="site-border flex flex-col justify-between gap-6 border-b pb-10 md:flex-row md:items-end">
					<h2 className="site-heading text-5xl tracking-tight md:text-7xl">
						{t("title")}
					</h2>
					<p className="site-muted max-w-sm text-lg">{t("subtitle")}</p>
				</Reveal>

				{albums.map((album, albumIndex) => {
					const spread = spreadFor(album, albumIndex);
					return (
						<article key={album.id} className="flex flex-col gap-8">
							<Reveal className="grid gap-4 md:grid-cols-12 md:items-end">
								<span className="site-heading site-accent-text text-6xl md:col-span-2 md:text-7xl">
									{String(albumIndex + 1).padStart(2, "0")}
								</span>
								<div className="flex flex-col gap-2 md:col-span-6">
									<h3 className="site-heading text-3xl md:text-4xl">
										{album.title}
									</h3>
									<p className="site-muted">{album.description}</p>
								</div>
								<button
									type="button"
									onClick={() => setOpen({ album: albumIndex, index: 0 })}
									className="group inline-flex items-center gap-2 text-sm font-medium md:col-span-4 md:justify-self-end"
								>
									{t("viewAll", { count: album.items.length })}
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</button>
							</Reveal>
							<Reveal
								delay={0.1}
								className="grid grid-flow-dense auto-rows-[140px] grid-cols-2 gap-3 md:auto-rows-[150px] md:grid-cols-6"
							>
								{album.items.slice(0, spread.length).map((media, index) => (
									<GalleryTile
										key={media.id}
										media={media}
										shape="fill"
										className={cn(spread[index])}
										sizes="(min-width: 768px) 50vw, 100vw"
										onClick={() => setOpen({ album: albumIndex, index })}
									/>
								))}
							</Reveal>
						</article>
					);
				})}
			</div>
			<Lightbox
				items={open ? albums[open.album].items : []}
				index={open?.index ?? null}
				onIndexChange={(index) =>
					setOpen((current) =>
						current && index !== null ? { ...current, index } : null,
					)
				}
			/>
		</section>
	);
}
