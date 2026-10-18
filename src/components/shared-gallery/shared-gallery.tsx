"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhotoLightbox } from "@/components/client-work/photo-lightbox";
import { PhotoTile } from "@/components/client-work/photo-tile";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import type { GalleryView } from "@/services/galleries/types";

/** A gallery opened from a share link: browse and view only. */
export function SharedGallery({
	gallery,
	token,
}: {
	gallery: GalleryView;
	token: string;
}) {
	const t = useTranslations("SharedGallery");
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	if (gallery.items.length === 0)
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				{t("empty")}
			</p>
		);

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{gallery.items.map((photo, index) => (
					<PhotoTile
						key={photo.id}
						photo={photo}
						openLabel={t("open", { name: photo.filename })}
						onOpen={() => setOpenIndex(index)}
					/>
				))}
			</div>
			<UrlPagination page={gallery.page} pageCount={gallery.pageCount} />
			<PhotoLightbox
				items={gallery.items}
				index={openIndex}
				onIndexChange={setOpenIndex}
				originals={gallery.originals}
				token={token}
			/>
		</div>
	);
}
