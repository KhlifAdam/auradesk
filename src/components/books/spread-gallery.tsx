"use client";

import { useTranslations } from "next-intl";
import type { BookDesign } from "@/lib/books/design";
import { BookCoverView } from "./book-cover-view";
import type { BookPhotos } from "./book-page-view";
import { SpreadView } from "./spread-view";

/** The whole book, read-only: the cover, then every spread in order. */
export function SpreadGallery({
	design,
	photos,
}: {
	design: BookDesign;
	photos: BookPhotos;
}) {
	const t = useTranslations("PhotoBook.editor");

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			<figure className="flex flex-col gap-1.5 sm:max-w-xs">
				<BookCoverView
					look={design}
					design={design}
					photos={photos}
					thumbnail
				/>
				<figcaption className="text-center text-[11px] text-muted-foreground">
					{t("cover")}
				</figcaption>
			</figure>
			{design.spreads.map((spread, index) => (
				<figure key={spread.id} className="flex flex-col gap-1.5">
					<SpreadView look={design} spread={spread} photos={photos} thumbnail />
					<figcaption className="text-center text-[11px] text-muted-foreground">
						{t("spreadLabel", { from: index * 2 + 1, to: index * 2 + 2 })}
					</figcaption>
				</figure>
			))}
		</div>
	);
}
