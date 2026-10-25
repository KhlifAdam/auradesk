import { arrayMove } from "@dnd-kit/sortable";
import { CENTERED, type Crop, clampCrop } from "./crop";
import {
	type BookDesign,
	type BookPage,
	type BookSlot,
	type BookSpread,
	emptyPage,
	emptySlot,
	emptySpread,
	newId,
	normalizePage,
	slotOf,
	spreadsFromPhotos,
} from "./design";
import { MAX_SPREADS } from "./formats";
import { type LayoutId, slotCount } from "./layouts";

export type BookMeta = Pick<
	BookDesign,
	"title" | "subtitle" | "format" | "margin" | "background" | "titleTone"
>;

export type Side = "left" | "right";

/** One spot for a photo: on the cover, on a page of a spread, or across a panorama. */
export type SlotRef =
	| { target: "cover" }
	| { target: Side; spreadId: string; index: number }
	| { target: "span"; spreadId: string };

export type BookAction =
	| { type: "meta"; patch: Partial<BookMeta> }
	| { type: "place"; ref: SlotRef; itemId: string | null }
	| { type: "adjust"; ref: SlotRef; crop: Partial<Crop> }
	| { type: "addSpread" }
	| { type: "duplicate"; spreadId: string }
	| { type: "remove"; spreadId: string }
	| { type: "move"; from: number; to: number }
	| { type: "kind"; spreadId: string; kind: BookSpread["kind"] }
	| { type: "layout"; spreadId: string; side: Side; layout: LayoutId }
	| { type: "caption"; spreadId: string; side: Side; caption: string }
	| { type: "fill"; itemIds: string[] };

const room = (design: BookDesign) => MAX_SPREADS - design.spreads.length;

const mapSpread = (
	design: BookDesign,
	spreadId: string,
	change: (spread: BookSpread) => BookSpread,
): BookDesign => ({
	...design,
	spreads: design.spreads.map((s) => (s.id === spreadId ? change(s) : s)),
});

const mapPage = (
	design: BookDesign,
	spreadId: string,
	side: Side,
	change: (page: BookPage) => BookPage,
): BookDesign =>
	mapSpread(design, spreadId, (spread) =>
		spread.kind === "pages"
			? { ...spread, [side]: normalizePage(change(spread[side])) }
			: spread,
	);

/** Applies `change` to the one slot a reference points at. */
function mapSlot(
	design: BookDesign,
	ref: SlotRef,
	change: (slot: BookSlot) => BookSlot,
): BookDesign {
	if (ref.target === "cover") return { ...design, cover: change(design.cover) };
	return mapSpread(design, ref.spreadId, (spread) => {
		if (ref.target === "span")
			return spread.kind === "panorama"
				? { ...spread, slot: change(spread.slot) }
				: spread;
		if (spread.kind !== "pages") return spread;
		const page = spread[ref.target];
		return {
			...spread,
			[ref.target]: {
				...page,
				slots: page.slots.map((s, i) => (i === ref.index ? change(s) : s)),
			},
		};
	});
}

/** The first photo of a spread, to keep when it changes kind. */
const firstPhoto = (spread: BookSpread) =>
	spread.kind === "panorama"
		? spread.slot.itemId
		: ([...spread.left.slots, ...spread.right.slots].find((s) => s.itemId)
				?.itemId ?? null);

/** Every edit the book editor can make, as a pure function of the design. */
export function bookReducer(
	design: BookDesign,
	action: BookAction,
): BookDesign {
	switch (action.type) {
		case "meta":
			return { ...design, ...action.patch };
		case "place":
			// A new photo starts centred and unzoomed.
			return mapSlot(design, action.ref, () => slotOf(action.itemId));
		case "adjust":
			return mapSlot(design, action.ref, (slot) => ({
				...slot,
				...clampCrop({ ...CENTERED, ...slot, ...action.crop }),
			}));
		case "addSpread":
			return room(design) > 0
				? { ...design, spreads: [...design.spreads, emptySpread()] }
				: design;
		case "duplicate": {
			const at = design.spreads.findIndex((s) => s.id === action.spreadId);
			if (at === -1 || room(design) <= 0) return design;
			const source = design.spreads[at];
			const copy: BookSpread =
				source.kind === "pages"
					? {
							...source,
							id: newId(),
							left: { ...source.left, id: newId() },
							right: { ...source.right, id: newId() },
						}
					: { ...source, id: newId() };
			const spreads = [...design.spreads];
			spreads.splice(at + 1, 0, copy);
			return { ...design, spreads };
		}
		case "remove":
			return {
				...design,
				spreads: design.spreads.filter((s) => s.id !== action.spreadId),
			};
		case "move":
			return {
				...design,
				spreads: arrayMove(design.spreads, action.from, action.to),
			};
		case "kind":
			return mapSpread(design, action.spreadId, (spread) => {
				if (spread.kind === action.kind) return spread;
				const photo = firstPhoto(spread);
				if (action.kind === "panorama")
					return { kind: "panorama", id: spread.id, slot: slotOf(photo) };
				// Back to two pages: the photo goes to the left page, the rest is empty.
				const left = emptyPage("single");
				left.slots = [slotOf(photo)];
				return { kind: "pages", id: spread.id, left, right: emptyPage() };
			});
		case "layout":
			return mapPage(design, action.spreadId, action.side, (page) => {
				// The photos stay in order; any that no longer fit leave the page.
				const kept = page.slots.filter((s) => s.itemId);
				const slots = Array.from(
					{ length: slotCount(action.layout) },
					(_, i) => kept[i] ?? emptySlot(),
				);
				return { ...page, layout: action.layout, slots };
			});
		case "caption":
			return mapPage(design, action.spreadId, action.side, (page) => ({
				...page,
				caption: action.caption,
			}));
		case "fill": {
			const spreads = spreadsFromPhotos(
				action.itemIds,
				design.spreads.length * 2,
			).slice(0, Math.max(0, room(design)));
			return { ...design, spreads: [...design.spreads, ...spreads] };
		}
	}
}
