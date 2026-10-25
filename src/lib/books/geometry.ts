import type { BookDesign, BookSlot } from "./design";
import type { SlotRef } from "./design-reducer";
import { BOOK_SIZES_MM } from "./formats";
import { type Rect, slotRects, spanRect } from "./layouts";

export interface PlacedSlot {
	slot: BookSlot;
	/** Where it sits, in mm from the trim corner of its page (or of the panorama). */
	rect: Rect;
	/** The rectangle is measured across both pages of a panorama. */
	span: boolean;
}

/** Every spot of the book with its size on paper: the cover, then each spread. */
export function placedSlots(design: BookDesign): PlacedSlot[] {
	const { w, h } = BOOK_SIZES_MM[design.format];
	const placed: PlacedSlot[] = [
		{ slot: design.cover, rect: { x: 0, y: 0, w, h }, span: false },
	];
	for (const spread of design.spreads) {
		if (spread.kind === "panorama") {
			placed.push({
				slot: spread.slot,
				rect: spanRect(design.format),
				span: true,
			});
			continue;
		}
		for (const page of [spread.left, spread.right]) {
			const rects = slotRects(page.layout, {
				format: design.format,
				margin: design.margin,
				captioned: Boolean(page.caption),
			});
			rects.forEach((rect, i) => {
				placed.push({ slot: page.slots[i], rect, span: false });
			});
		}
	}
	return placed;
}

/** One spot by reference, with its size on paper; null when the reference is stale. */
export function placedFor(design: BookDesign, ref: SlotRef): PlacedSlot | null {
	const { w, h } = BOOK_SIZES_MM[design.format];
	if (ref.target === "cover")
		return { slot: design.cover, rect: { x: 0, y: 0, w, h }, span: false };
	const spread = design.spreads.find((s) => s.id === ref.spreadId);
	if (!spread) return null;
	if (ref.target === "span")
		return spread.kind === "panorama"
			? { slot: spread.slot, rect: spanRect(design.format), span: true }
			: null;
	if (spread.kind !== "pages") return null;
	const page = spread[ref.target];
	const rect = slotRects(page.layout, {
		format: design.format,
		margin: design.margin,
		captioned: Boolean(page.caption),
	})[ref.index];
	const slot = page.slots[ref.index];
	return rect && slot ? { slot, rect, span: false } : null;
}

/** The first empty spot of a spread, left page first; null when it is full. */
export function firstEmptySlot(
	spread: BookDesign["spreads"][number],
): SlotRef | null {
	if (spread.kind === "panorama")
		return spread.slot.itemId ? null : { target: "span", spreadId: spread.id };
	for (const side of ["left", "right"] as const) {
		const index = spread[side].slots.findIndex((s) => !s.itemId);
		if (index !== -1) return { target: side, spreadId: spread.id, index };
	}
	return null;
}
