"use client";

import { useTranslations } from "next-intl";
import type { BookPage } from "@/lib/books/design";
import {
	BOOK_SIZES_MM,
	CAPTION_BAND_MM,
	isDarkBackground,
	MARGIN_MM,
} from "@/lib/books/formats";
import { isFullBleed, slotRects } from "@/lib/books/layouts";
import { cn } from "@/lib/utils";
import type { BookPhoto } from "@/services/books/types";
import { BookSlotView, isLowResolution, type PanMove } from "./book-slot";
import { cqw, PageFrame, type PageLook, percent, place } from "./page-frame";

export type BookPhotos = Record<string, BookPhoto>;

interface PageViewProps {
	look: PageLook;
	page: BookPage;
	photos: BookPhotos;
	/** Small copies in the page strip: no controls, no warnings. */
	thumbnail?: boolean;
	selectedSlot?: number | null;
	onSelectSlot?: (index: number) => void;
	onClearSlot?: (index: number) => void;
	onPanSlot?: (index: number, move: PanMove) => void;
}

/** One inside page, drawn from the same layout maths as the print. */
export function BookPageView({
	look,
	page,
	photos,
	thumbnail,
	selectedSlot,
	onSelectSlot,
	onClearSlot,
	onPanSlot,
}: PageViewProps) {
	const t = useTranslations("PhotoBook.editor");
	const { w, h } = BOOK_SIZES_MM[look.format];
	const captioned = Boolean(page.caption);
	const rects = slotRects(page.layout, { ...look, captioned });
	const margin = MARGIN_MM[look.margin].margin;

	return (
		<PageFrame look={look} className={thumbnail ? "" : "rounded-sm"}>
			{rects.map((rect, i) => {
				const slot = page.slots[i];
				const photo = slot.itemId ? photos[slot.itemId] : undefined;
				return (
					<BookSlotView
						// biome-ignore lint/suspicious/noArrayIndexKey: slots are positional.
						key={i}
						slot={slot}
						photo={photo}
						placement={place(rect, w, h)}
						label={t("selectSlot", { number: i + 1 })}
						thumbnail={thumbnail}
						selected={!thumbnail && selectedSlot === i}
						lowResolution={
							!thumbnail && isLowResolution(photo, slot, rect, look.format)
						}
						onSelect={() => onSelectSlot?.(i)}
						onClear={() => onClearSlot?.(i)}
						onPan={(move) => onPanSlot?.(i, move)}
					/>
				);
			})}
			{captioned && !isFullBleed(page.layout) && (
				<p
					className={cn(
						"absolute flex items-center justify-center text-center",
						isDarkBackground(look.background)
							? "text-neutral-300"
							: "text-neutral-600",
					)}
					style={{
						left: percent(margin, w),
						width: percent(w - margin * 2, w),
						top: percent(h - margin - CAPTION_BAND_MM, h),
						height: percent(CAPTION_BAND_MM, h),
						fontSize: cqw(3.4, w),
					}}
				>
					<span className="truncate">{page.caption}</span>
				</p>
			)}
		</PageFrame>
	);
}
