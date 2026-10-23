"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SiteAlbum } from "@/services/public-site/types";
import { GalleryTile } from "../../shared/gallery-tile";
import { Lightbox } from "../../shared/lightbox";
import { PortfolioTabs } from "../../shared/portfolio-tabs";
import { Reveal } from "../../shared/reveal";
import { usePortfolioGallery } from "../../shared/use-portfolio-gallery";

const PAGE = 9;

/** Calm 3-column grid with rounded tiles, pill filters and "show more". */
export function MinimalPortfolio({ albums }: { albums: SiteAlbum[] }) {
	const t = useTranslations("PublicSite.portfolio");
	const gallery = usePortfolioGallery(albums);
	const [limit, setLimit] = useState(PAGE);
	const visible = gallery.items.slice(0, limit);

	return (
		<section id="portfolio" className="px-6 py-24 md:px-8 md:py-32">
			<div className="mx-auto max-w-6xl">
				<Reveal className="mb-12 flex flex-col items-center gap-4 text-center">
					<span className="site-accent-text text-xs font-semibold uppercase tracking-[0.3em]">
						{t("eyebrow")}
					</span>
					<h2 className="site-heading text-4xl tracking-tight md:text-5xl">
						{t("title")}
					</h2>
					<p className="site-muted max-w-xl text-lg">{t("subtitle")}</p>
				</Reveal>

				<PortfolioTabs
					tabs={gallery.tabs}
					active={gallery.active}
					onSelect={(id) => {
						gallery.selectTab(id);
						setLimit(PAGE);
					}}
					className="mb-10 justify-center"
					tabClassName="rounded-full px-5 py-2 text-sm font-medium transition-all duration-300"
					activeClassName="bg-[var(--s-fg)] text-[var(--s-bg)]"
					inactiveClassName="site-muted hover:text-[var(--s-fg)]"
				/>

				{/* Masonry: every photo keeps its own shape, portrait or landscape. */}
				<div className="columns-2 gap-3 md:columns-3 md:gap-5">
					{visible.map((media, index) => (
						<GalleryTile
							key={media.id}
							media={media}
							shape="natural"
							caption={media.alt}
							className="mb-3 break-inside-avoid rounded-xl md:mb-5"
							sizes="(min-width: 768px) 33vw, 50vw"
							onClick={() => gallery.setLightbox(index)}
						/>
					))}
				</div>

				{gallery.items.length > limit && (
					<div className="mt-12 flex justify-center">
						<button
							type="button"
							onClick={() => setLimit((current) => current + PAGE)}
							className="site-border rounded-full border px-8 py-3 text-sm font-medium transition-colors hover:border-[var(--s-fg)]"
						>
							{t("showMore")}
						</button>
					</div>
				)}
			</div>
			<Lightbox
				items={gallery.items}
				index={gallery.lightbox}
				onIndexChange={gallery.setLightbox}
			/>
		</section>
	);
}
