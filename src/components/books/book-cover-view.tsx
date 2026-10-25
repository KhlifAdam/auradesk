"use client";

import { useTranslations } from "next-intl";
import { coverGeometry } from "@/lib/books/cover";
import type { BookDesign } from "@/lib/books/design";
import { BOOK_SIZES_MM, isDarkBackground } from "@/lib/books/formats";
import type { BookPhotos } from "./book-page-view";
import { BookSlotView, isLowResolution, type PanMove } from "./book-slot";
import { cqw, PageFrame, type PageLook, percent } from "./page-frame";

interface CoverViewProps {
	look: PageLook;
	design: Pick<BookDesign, "title" | "subtitle" | "cover" | "titleTone">;
	photos: BookPhotos;
	thumbnail?: boolean;
	selected?: boolean;
	onSelect?: () => void;
	onClear?: () => void;
	onPan?: (move: PanMove) => void;
}

/** The cover: its photo edge to edge, the title in a band along the bottom. */
export function BookCoverView({
	look,
	design,
	photos,
	thumbnail,
	selected,
	onSelect,
	onClear,
	onPan,
}: CoverViewProps) {
	const t = useTranslations("PhotoBook.editor");
	const { w, h } = BOOK_SIZES_MM[look.format];
	const g = coverGeometry(look.format);
	const photo = design.cover.itemId ? photos[design.cover.itemId] : undefined;
	const light = photo
		? design.titleTone === "light"
		: isDarkBackground(look.background);
	const hasText = Boolean(design.title || design.subtitle);

	return (
		<PageFrame look={look} className={thumbnail ? "" : "rounded-sm"}>
			<BookSlotView
				slot={design.cover}
				photo={photo}
				placement={{ left: 0, top: 0, width: "100%", height: "100%" }}
				label={t("selectCover")}
				thumbnail={thumbnail}
				selected={selected}
				lowResolution={
					!thumbnail &&
					isLowResolution(
						photo,
						design.cover,
						{ x: 0, y: 0, w, h },
						look.format,
					)
				}
				onSelect={onSelect}
				onClear={onClear}
				onPan={onPan}
			/>
			{!photo && !thumbnail && (
				<p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-xs text-foreground/40">
					{t("noCover")}
				</p>
			)}
			{(photo || hasText) && (
				<div
					className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center"
					style={{
						height: percent(g.bandHeight, h),
						backgroundColor: photo
							? `rgb(${light ? "0 0 0" : "255 255 255"} / ${g.bandOpacity})`
							: undefined,
						color: light ? "#fff" : "#1a1a1a",
					}}
				>
					<p
						className="line-clamp-2 font-serif font-bold leading-tight"
						style={{
							fontSize: cqw(g.titleSize, w),
							maxWidth: percent(g.textWidth, w),
						}}
					>
						{design.title}
					</p>
					{design.subtitle && (
						<p
							className="line-clamp-2 leading-tight"
							style={{
								fontSize: cqw(g.subtitleSize, w),
								maxWidth: percent(g.textWidth, w),
								marginTop: cqw(g.subtitleSize * 0.6, w),
							}}
						>
							{design.subtitle}
						</p>
					)}
				</div>
			)}
		</PageFrame>
	);
}
