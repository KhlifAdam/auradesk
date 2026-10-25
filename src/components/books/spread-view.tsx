"use client";

import { useTranslations } from "next-intl";
import type { BookSpread } from "@/lib/books/design";
import type { Side, SlotRef } from "@/lib/books/design-reducer";
import { BOOK_SIZES_MM } from "@/lib/books/formats";
import { spanRect } from "@/lib/books/layouts";
import { BookPageView, type BookPhotos } from "./book-page-view";
import { BookSlotView, isLowResolution, type PanMove } from "./book-slot";
import { PageFrame, type PageLook } from "./page-frame";

interface SpreadViewProps {
	look: PageLook;
	spread: BookSpread;
	photos: BookPhotos;
	thumbnail?: boolean;
	/** The spot being edited, when it is in this spread. */
	selected?: SlotRef | null;
	onSelect?: (ref: SlotRef) => void;
	onClear?: (ref: SlotRef) => void;
	onPan?: (ref: SlotRef, move: PanMove) => void;
}

/** Two facing pages side by side, or one panoramic photo running across both. */
export function SpreadView({
	look,
	spread,
	photos,
	thumbnail,
	selected,
	onSelect,
	onClear,
	onPan,
}: SpreadViewProps) {
	const t = useTranslations("PhotoBook.editor");

	if (spread.kind === "panorama") {
		const ref: SlotRef = { target: "span", spreadId: spread.id };
		const photo = spread.slot.itemId ? photos[spread.slot.itemId] : undefined;
		const rect = spanRect(look.format);
		return (
			<PageFrame look={look} span className={thumbnail ? "" : "rounded-sm"}>
				<BookSlotView
					slot={spread.slot}
					photo={photo}
					placement={{ left: 0, top: 0, width: "100%", height: "100%" }}
					label={t("selectPanorama")}
					thumbnail={thumbnail}
					selected={selected?.target === "span"}
					lowResolution={
						!thumbnail &&
						isLowResolution(photo, spread.slot, rect, look.format, true)
					}
					onSelect={() => onSelect?.(ref)}
					onClear={() => onClear?.(ref)}
					onPan={(move) => onPan?.(ref, move)}
				/>
				{!thumbnail && (
					<span
						aria-hidden
						className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-foreground/15"
					/>
				)}
			</PageFrame>
		);
	}

	const pageRef = (side: Side, index: number): SlotRef => ({
		target: side,
		spreadId: spread.id,
		index,
	});
	const selectedIn = (side: Side) =>
		selected?.target === side ? selected.index : null;

	return (
		<div
			className="flex w-full gap-px bg-foreground/15"
			style={{ aspectRatio: aspect(look) }}
		>
			{(["left", "right"] as const).map((side) => (
				<div key={side} className="min-w-0 flex-1">
					<BookPageView
						look={look}
						page={spread[side]}
						photos={photos}
						thumbnail={thumbnail}
						selectedSlot={selectedIn(side)}
						onSelectSlot={(i) => onSelect?.(pageRef(side, i))}
						onClearSlot={(i) => onClear?.(pageRef(side, i))}
						onPanSlot={(i, move) => onPan?.(pageRef(side, i), move)}
					/>
				</div>
			))}
		</div>
	);
}

/** Two pages and the hairline between them. */
const aspect = (look: PageLook) => {
	const { w, h } = BOOK_SIZES_MM[look.format];
	return `${w * 2} / ${h}`;
};
