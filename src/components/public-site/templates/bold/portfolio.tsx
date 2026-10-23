"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SiteAlbum, SiteMedia } from "@/services/public-site/types";
import { GalleryTile } from "../../shared/gallery-tile";
import { Lightbox } from "../../shared/lightbox";
import { orientationOf } from "../../shared/photo-layout";
import { PortfolioTabs } from "../../shared/portfolio-tabs";
import { Reveal } from "../../shared/reveal";
import { usePortfolioGallery } from "../../shared/use-portfolio-gallery";

const PAGE = 12;

/**
 * Bento tiles shaped by the photo: portraits stand tall (one column, two
 * rows), landscapes sit in one cell, and every sixth landscape is featured
 * big. One cell is landscape-shaped, so nothing is cropped much.
 */
function bentoSpan(media: SiteMedia, index: number) {
	if (orientationOf(media) === "portrait") return "row-span-2";
	if (index % 6 === 0) return "col-span-2 row-span-2";
	return "";
}

/** Dense edge-to-edge bento mosaic with hard-cornered filters. */
export function BoldPortfolio({ albums }: { albums: SiteAlbum[] }) {
	const t = useTranslations("PublicSite.portfolio");
	const gallery = usePortfolioGallery(albums);
	const [limit, setLimit] = useState(PAGE);
	const visible = gallery.items.slice(0, limit);

	return (
		<section id="portfolio" className="px-4 py-24 md:px-8 md:py-32">
			<Reveal className="mb-12 flex flex-col justify-between gap-6 px-2 md:flex-row md:items-end md:px-4">
				<div className="flex flex-col gap-3">
					<span className="site-accent-text text-xs font-bold uppercase tracking-[0.35em]">
						{t("eyebrow")}
					</span>
					<h2 className="site-heading pt-[0.12em] text-5xl font-bold uppercase leading-[0.9] tracking-tighter md:text-8xl">
						{t("title")}
					</h2>
				</div>
				<PortfolioTabs
					tabs={gallery.tabs}
					active={gallery.active}
					onSelect={(id) => {
						gallery.selectTab(id);
						setLimit(PAGE);
					}}
					className="md:max-w-xl md:justify-end"
					tabClassName="border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
					activeClassName="site-accent-bg border-transparent"
					inactiveClassName="site-border site-muted hover:border-[var(--s-fg)] hover:text-[var(--s-fg)]"
				/>
			</Reveal>

			<div className="grid grid-flow-dense auto-rows-[120px] grid-cols-2 gap-2 md:auto-rows-[260px] md:grid-cols-4">
				{visible.map((media, index) => (
					<GalleryTile
						key={media.id}
						media={media}
						shape="fill"
						caption={media.alt}
						className={cn(bentoSpan(media, index))}
						sizes="(min-width: 768px) 50vw, 100vw"
						onClick={() => gallery.setLightbox(index)}
					/>
				))}
			</div>

			{gallery.items.length > limit && (
				<div className="mt-10 flex justify-center">
					<button
						type="button"
						onClick={() => setLimit((current) => current + PAGE)}
						className="site-border border px-10 py-4 text-xs font-bold uppercase tracking-[0.3em] transition-colors hover:border-[var(--s-accent)] hover:text-[var(--s-accent)]"
					>
						{t("showMore")}
					</button>
				</div>
			)}
			<Lightbox
				items={gallery.items}
				index={gallery.lightbox}
				onIndexChange={gallery.setLightbox}
			/>
		</section>
	);
}
