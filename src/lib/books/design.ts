import { z } from "zod";
import { CENTERED, type Crop } from "./crop";
import {
	BOOK_BACKGROUNDS,
	BOOK_FORMATS,
	BOOK_MARGINS,
	type BookFormat,
	MAX_SPREADS,
} from "./formats";
import { isFullBleed, LAYOUT_IDS, type LayoutId, slotCount } from "./layouts";

const itemId = z.string().min(1).max(40);
const id = z.string().min(1).max(40);

/** A photo in a spot (or an empty spot), and how it sits there. */
export const bookSlotSchema = z.object({
	itemId: itemId.nullable(),
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	zoom: z.number().min(1).max(3),
});

export const bookPageSchema = z.object({
	id,
	layout: z.enum(LAYOUT_IDS),
	/** One spot per slot of the layout. */
	slots: z.array(bookSlotSchema).max(6),
	caption: z.string().trim().max(160),
});

/**
 * Pages come in facing pairs. A spread is either two pages with their own
 * layouts, or one panoramic photo running across both.
 */
export const spreadSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("pages"),
		id,
		left: bookPageSchema,
		right: bookPageSchema,
	}),
	z.object({ kind: z.literal("panorama"), id, slot: bookSlotSchema }),
]);

export const bookDesignSchema = z.object({
	title: z.string().trim().max(80),
	subtitle: z.string().trim().max(120),
	format: z.enum(BOOK_FORMATS),
	margin: z.enum(BOOK_MARGINS),
	background: z.enum(BOOK_BACKGROUNDS),
	/** Title colour on the cover: light text over a dark photo, or the reverse. */
	titleTone: z.enum(["light", "dark"]),
	cover: bookSlotSchema,
	spreads: z.array(spreadSchema).max(MAX_SPREADS),
});

export type BookSlot = z.infer<typeof bookSlotSchema>;
export type BookPage = z.infer<typeof bookPageSchema>;
export type BookSpread = z.infer<typeof spreadSchema>;
export type BookDesign = z.infer<typeof bookDesignSchema>;
export type PagesSpread = Extract<BookSpread, { kind: "pages" }>;

export const newId = () => globalThis.crypto.randomUUID().slice(0, 12);

export const slotOf = (
	itemId: string | null,
	crop: Crop = CENTERED,
): BookSlot => ({
	itemId,
	...crop,
});
export const emptySlot = () => slotOf(null);

export function emptyPage(layout: LayoutId = "single"): BookPage {
	return {
		id: newId(),
		layout,
		slots: Array.from({ length: slotCount(layout) }, emptySlot),
		caption: "",
	};
}

export const emptySpread = (): BookSpread => ({
	kind: "pages",
	id: newId(),
	left: emptyPage(),
	right: emptyPage(),
});

/** Slots padded or cut to the layout's size, and no caption where there is no room. */
export function normalizePage(page: BookPage): BookPage {
	return {
		...page,
		slots: Array.from(
			{ length: slotCount(page.layout) },
			(_, i) => page.slots[i] ?? emptySlot(),
		),
		caption: isFullBleed(page.layout) ? "" : page.caption,
	};
}

export const normalizeSpread = (spread: BookSpread): BookSpread =>
	spread.kind === "pages"
		? {
				...spread,
				left: normalizePage(spread.left),
				right: normalizePage(spread.right),
			}
		: spread;

/** The same book with every page made consistent. Run on every save. */
export const normalizeDesign = (design: BookDesign): BookDesign => ({
	...design,
	spreads: design.spreads.map(normalizeSpread),
});

/** Every slot of the book, cover included, wherever it is. */
export function allSlots(design: BookDesign): BookSlot[] {
	return [
		design.cover,
		...design.spreads.flatMap((spread) =>
			spread.kind === "pages"
				? [...spread.left.slots, ...spread.right.slots]
				: [spread.slot],
		),
	];
}

/** The same book with `change` applied to every slot, cover included. */
export function mapAllSlots(
	design: BookDesign,
	change: (slot: BookSlot) => BookSlot,
): BookDesign {
	const page = (p: BookPage): BookPage => ({
		...p,
		slots: p.slots.map(change),
	});
	return {
		...design,
		cover: change(design.cover),
		spreads: design.spreads.map((spread) =>
			spread.kind === "pages"
				? { ...spread, left: page(spread.left), right: page(spread.right) }
				: { ...spread, slot: change(spread.slot) },
		),
	};
}

/** Every photo a design uses, once each (cover included). */
export function usedItemIds(design: BookDesign) {
	const ids = new Set<string>();
	for (const slot of allSlots(design)) if (slot.itemId) ids.add(slot.itemId);
	return [...ids];
}

/** Printed pages inside the book (the cover is not counted). */
export const pageCount = (design: BookDesign) => design.spreads.length * 2;

/** The rhythm auto-fill follows: a full page, then busier ones, back to calm. */
const RHYTHM: LayoutId[] = [
	"full",
	"two-side",
	"three-left",
	"single",
	"four-grid",
	"two-stack",
	"three-top",
	"six-grid",
];

/** The layout that holds exactly this many photos (four at most). */
const FIT_BY_COUNT: Record<number, LayoutId> = {
	1: "single",
	2: "two-side",
	3: "three-left",
	4: "four-grid",
};

/** New pages holding these photos in order, following the rhythm. */
export function pagesFromPhotos(ids: string[], startAt = 0): BookPage[] {
	const pages: BookPage[] = [];
	let next = 0;
	for (let turn = startAt; next < ids.length; turn++) {
		const layout = RHYTHM[turn % RHYTHM.length];
		// Near the end, a layout that fits what is left rather than one with holes.
		const left = ids.length - next;
		const fitted: LayoutId =
			left >= slotCount(layout) ? layout : FIT_BY_COUNT[Math.min(left, 4)];
		const slots = ids.slice(next, next + slotCount(fitted));
		next += slots.length;
		pages.push(
			normalizePage({
				...emptyPage(fitted),
				slots: slots.map((s) => slotOf(s)),
			}),
		);
	}
	return pages;
}

/** New spreads holding these photos in order; an odd last page gets an empty partner. */
export function spreadsFromPhotos(ids: string[], startAt = 0): BookSpread[] {
	const pages = pagesFromPhotos(ids, startAt);
	const spreads: BookSpread[] = [];
	for (let i = 0; i < pages.length; i += 2)
		spreads.push({
			kind: "pages",
			id: newId(),
			left: pages[i],
			right: pages[i + 1] ?? emptyPage(),
		});
	return spreads;
}

export function newDesign(
	format: BookFormat,
	title: string,
	photoIds: string[],
): BookDesign {
	const [cover, ...rest] = photoIds;
	return {
		title,
		subtitle: "",
		format,
		margin: "normal",
		background: "white",
		titleTone: "light",
		cover: slotOf(cover ?? null),
		spreads: spreadsFromPhotos(rest),
	};
}

/**
 * Designs saved before spreads and photo positions existed had a flat list of
 * pages and a cover id. Reads those into the current shape, so no book is lost.
 */
export function upgradeDesign(raw: unknown): unknown {
	if (!raw || typeof raw !== "object" || "spreads" in raw) return raw;
	const old = raw as Record<string, unknown>;
	if (!Array.isArray(old.pages)) return raw;
	const asSlot = (value: unknown) =>
		slotOf(typeof value === "string" ? value : null);
	const pages = old.pages.map((page) => ({
		...page,
		slots: Array.isArray(page.slots) ? page.slots.map(asSlot) : [],
	}));
	const spreads = [];
	for (let i = 0; i < pages.length; i += 2)
		spreads.push({
			kind: "pages",
			id: newId(),
			left: pages[i],
			right: pages[i + 1] ?? emptyPage(),
		});
	const { pages: _pages, coverItemId, ...rest } = old;
	return { ...rest, cover: asSlot(coverItemId), spreads };
}

/** A stored design, upgraded if old, checked against the current shape. */
export const parseBookDesign = (raw: unknown) =>
	bookDesignSchema.safeParse(upgradeDesign(raw));
