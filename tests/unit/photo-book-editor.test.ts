import { describe, expect, it } from "vitest";
import { type BookDesign, type PagesSpread, newDesign } from "@/lib/books/design";
import { type SlotRef, bookReducer } from "@/lib/books/design-reducer";
import { MAX_SPREADS } from "@/lib/books/formats";

const ids = Array.from({ length: 12 }, (_, i) => `p${i}`);
const base = (): BookDesign => newDesign("landscape", "Book", ids);
const pages = (design: BookDesign, at: number) => {
	const spread = design.spreads[at];
	if (spread.kind !== "pages") throw new Error("expected two pages");
	return spread as PagesSpread;
};
const photos = (spread: PagesSpread) =>
	[...spread.left.slots, ...spread.right.slots].map((s) => s.itemId);

describe("the book editor's edits", () => {
	it("changes the book's own settings", () => {
		const design = bookReducer(base(), {
			type: "meta",
			patch: { title: "New", format: "square", background: "black" },
		});
		expect(design).toMatchObject({ title: "New", format: "square", background: "black" });
	});

	it("sets and clears the cover, and a new photo starts centred", () => {
		const moved = bookReducer(base(), {
			type: "adjust",
			ref: { target: "cover" },
			crop: { x: 0.2, y: 0.8, zoom: 2 },
		});
		expect(moved.cover).toMatchObject({ x: 0.2, y: 0.8, zoom: 2 });
		const swapped = bookReducer(moved, { type: "place", ref: { target: "cover" }, itemId: "p9" });
		expect(swapped.cover).toEqual({ itemId: "p9", x: 0.5, y: 0.5, zoom: 1 });
		const cleared = bookReducer(swapped, { type: "place", ref: { target: "cover" }, itemId: null });
		expect(cleared.cover.itemId).toBeNull();
	});

	it("keeps a photo's position within bounds", () => {
		const ref: SlotRef = { target: "cover" };
		const wild = bookReducer(base(), { type: "adjust", ref, crop: { x: -4, y: 9, zoom: 99 } });
		expect(wild.cover).toMatchObject({ x: 0, y: 1, zoom: 3 });
		const flat = bookReducer(wild, { type: "adjust", ref, crop: { zoom: 0.1 } });
		expect(flat.cover.zoom).toBe(1);
	});

	it("adds an empty spread of two pages", () => {
		const design = bookReducer(base(), { type: "addSpread" });
		const added = pages(design, design.spreads.length - 1);
		expect(photos(added)).toEqual([null, null]);
	});

	it("never goes past the spread limit", () => {
		let design = base();
		for (let i = 0; i < MAX_SPREADS + 5; i++) design = bookReducer(design, { type: "addSpread" });
		expect(design.spreads).toHaveLength(MAX_SPREADS);
		const first = design.spreads[0].id;
		expect(bookReducer(design, { type: "duplicate", spreadId: first }).spreads).toHaveLength(MAX_SPREADS);
		expect(bookReducer(design, { type: "fill", itemIds: ["a", "b"] }).spreads).toHaveLength(MAX_SPREADS);
	});

	it("duplicates a spread right after itself, with new ids all through", () => {
		const design = base();
		const copy = bookReducer(design, { type: "duplicate", spreadId: design.spreads[1].id });
		expect(copy.spreads).toHaveLength(design.spreads.length + 1);
		const [source, twin] = [pages(design, 1), pages(copy, 2)];
		expect(photos(twin)).toEqual(photos(source));
		expect(new Set([source.id, twin.id, twin.left.id, twin.right.id, source.left.id]).size).toBe(5);
	});

	it("removes and reorders spreads", () => {
		const design = base();
		const [a, b, c] = design.spreads;
		expect(bookReducer(design, { type: "remove", spreadId: b.id }).spreads.map((s) => s.id)).not.toContain(b.id);
		const moved = bookReducer(design, { type: "move", from: 0, to: 2 });
		expect(moved.spreads.slice(0, 3).map((s) => s.id)).toEqual([b.id, c.id, a.id]);
	});

	it("turns a spread into a panorama and back, keeping its first photo", () => {
		const design = base();
		const spread = pages(design, 0);
		const first = photos(spread).find(Boolean);
		const wide = bookReducer(design, { type: "kind", spreadId: spread.id, kind: "panorama" });
		expect(wide.spreads[0]).toMatchObject({ kind: "panorama", slot: { itemId: first } });
		const back = bookReducer(wide, { type: "kind", spreadId: spread.id, kind: "pages" });
		const restored = pages(back, 0);
		expect(restored.left.slots[0].itemId).toBe(first);
		expect(restored.right.slots.every((s) => !s.itemId)).toBe(true);
	});

	it("puts a photo on a panorama and moves it", () => {
		const start = base();
		const design = bookReducer(start, {
			type: "kind",
			spreadId: start.spreads[0].id,
			kind: "panorama",
		});
		const id = design.spreads[0].id;
		const ref: SlotRef = { target: "span", spreadId: id };
		const placed = bookReducer(design, { type: "place", ref, itemId: "p11" });
		expect(placed.spreads[0]).toMatchObject({ slot: { itemId: "p11" } });
		const zoomed = bookReducer(placed, { type: "adjust", ref, crop: { zoom: 1.5, x: 0.25 } });
		expect(zoomed.spreads[0]).toMatchObject({ slot: { zoom: 1.5, x: 0.25, y: 0.5 } });
	});

	it("keeps the photos in order when a page changes layout", () => {
		const design = base();
		const spread = pages(design, 0);
		const before = spread.left.slots.filter((s) => s.itemId).map((s) => s.itemId);
		const two = bookReducer(design, { type: "layout", spreadId: spread.id, side: "left", layout: "two-side" });
		expect(pages(two, 0).left.slots.map((s) => s.itemId)).toEqual(before.slice(0, 2).concat(before.length < 2 ? [null] : []));
		const six = bookReducer(two, { type: "layout", spreadId: spread.id, side: "left", layout: "six-grid" });
		expect(pages(six, 0).left.slots).toHaveLength(6);
	});

	it("puts a photo in a page's spot and clears it again", () => {
		const design = bookReducer(base(), { type: "addSpread" });
		const spread = pages(design, design.spreads.length - 1);
		const ref: SlotRef = { target: "right", spreadId: spread.id, index: 0 };
		const filled = bookReducer(design, { type: "place", ref, itemId: "p7" });
		expect(pages(filled, filled.spreads.length - 1).right.slots[0].itemId).toBe("p7");
		const cleared = bookReducer(filled, { type: "place", ref, itemId: null });
		expect(pages(cleared, cleared.spreads.length - 1).right.slots[0].itemId).toBeNull();
	});

	it("drops the caption of a full-bleed page, where there is no room", () => {
		const design = bookReducer(base(), { type: "addSpread" });
		const spread = pages(design, design.spreads.length - 1);
		const captioned = bookReducer(design, { type: "caption", spreadId: spread.id, side: "left", caption: "Hello" });
		expect(pages(captioned, captioned.spreads.length - 1).left.caption).toBe("Hello");
		const full = bookReducer(captioned, { type: "layout", spreadId: spread.id, side: "left", layout: "full" });
		expect(pages(full, full.spreads.length - 1).left.caption).toBe("");
	});

	it("adds unused photos as new spreads after the existing ones", () => {
		const design = base();
		const filled = bookReducer(design, { type: "fill", itemIds: ["x1", "x2", "x3"] });
		const added = filled.spreads
			.slice(design.spreads.length)
			.flatMap((s) => (s.kind === "pages" ? photos(s) : []))
			.filter(Boolean);
		expect(added).toEqual(["x1", "x2", "x3"]);
	});
});
