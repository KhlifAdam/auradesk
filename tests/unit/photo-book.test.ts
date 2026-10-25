import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CENTERED, cropStyle, panCrop, visibleWindow } from "@/lib/books/crop";
import {
	allSlots,
	bookDesignSchema,
	newDesign,
	normalizePage,
	pageCount,
	parseBookDesign,
	slotOf,
	spreadsFromPhotos,
	upgradeDesign,
	usedItemIds,
} from "@/lib/books/design";
import {
	BLEED_MM,
	BOOK_FORMATS,
	BOOK_MARGINS,
	BOOK_SIZES_MM,
	CAPTION_BAND_MM,
	MAX_SPREADS,
	mmToPt,
} from "@/lib/books/formats";
import {
	LAYOUT_IDS,
	printDpi,
	type Rect,
	slotCount,
	slotRects,
	spanRect,
	withBleed,
} from "@/lib/books/layouts";
import { wrapText } from "@/lib/books/pdf-text";
import { buildBookPdf, type PhotoRequest } from "@/services/books/pdf-builder";

const EPS = 0.001;
const overlap = (a: Rect, b: Rect) =>
	a.x < b.x + b.w - EPS &&
	b.x < a.x + a.w - EPS &&
	a.y < b.y + b.h - EPS &&
	b.y < a.y + a.h - EPS;

describe("page layouts", () => {
	for (const format of BOOK_FORMATS) {
		const { w, h } = BOOK_SIZES_MM[format];
		for (const margin of BOOK_MARGINS) {
			for (const captioned of [false, true]) {
				it(`keep every slot on the ${format} page (${margin}${captioned ? ", captioned" : ""})`, () => {
					for (const layout of LAYOUT_IDS) {
						const rects = slotRects(layout, { format, margin, captioned });
						expect(rects).toHaveLength(slotCount(layout));
						for (const r of rects) {
							expect(r.w).toBeGreaterThan(0);
							expect(r.h).toBeGreaterThan(0);
							expect(r.x).toBeGreaterThanOrEqual(-EPS);
							expect(r.y).toBeGreaterThanOrEqual(-EPS);
							expect(r.x + r.w).toBeLessThanOrEqual(w + EPS);
							expect(r.y + r.h).toBeLessThanOrEqual(h + EPS);
						}
						for (let i = 0; i < rects.length; i++)
							for (let j = i + 1; j < rects.length; j++)
								expect(overlap(rects[i], rects[j])).toBe(false);
					}
				});
			}
		}
	}

	it("leaves the margin around the photos, and room for a caption", () => {
		const plain = slotRects("single", { format: "landscape", margin: "normal", captioned: false })[0];
		expect(plain).toMatchObject({ x: 14, y: 14, w: 297 - 28, h: 210 - 28 });
		const captioned = slotRects("single", { format: "landscape", margin: "normal", captioned: true })[0];
		expect(captioned.h).toBeCloseTo(plain.h - CAPTION_BAND_MM);
	});

	it("puts the gap between photos", () => {
		const [a, b] = slotRects("two-side", { format: "landscape", margin: "normal", captioned: false });
		expect(b.x - (a.x + a.w)).toBeCloseTo(5);
	});

	it("runs a full-bleed photo edge to edge whatever the margin", () => {
		const [rect] = slotRects("full", { format: "square", margin: "airy", captioned: true });
		expect(rect).toEqual({ x: 0, y: 0, w: 210, h: 210 });
	});

	it("extends photos at the page edge into the bleed, and only those", () => {
		expect(withBleed({ x: 0, y: 0, w: 210, h: 210 }, "square")).toEqual({
			x: -BLEED_MM,
			y: -BLEED_MM,
			w: 210 + BLEED_MM * 2,
			h: 210 + BLEED_MM * 2,
		});
		const inner = { x: 14, y: 14, w: 100, h: 100 };
		expect(withBleed(inner, "square")).toEqual(inner);
	});

	it("measures a panorama across both pages", () => {
		expect(spanRect("landscape")).toEqual({ x: 0, y: 0, w: 594, h: 210 });
		// Across the two pages the spine is not an edge, only the outer sides are.
		const printed = withBleed(spanRect("landscape"), "landscape", true);
		expect(printed.w).toBe(594 + BLEED_MM * 2);
		expect(printed.x).toBe(-BLEED_MM);
	});

	it("estimates print sharpness from the photo, the slot and the zoom", () => {
		expect(printDpi({ width: 3000, height: 2000 }, { x: 0, y: 0, w: 254, h: 169.3 })).toBeCloseTo(300, 0);
		expect(printDpi({ width: 4000, height: 1000 }, { x: 0, y: 0, w: 100, h: 100 })).toBeCloseTo(254, 0);
		// Zooming in stretches the same pixels over the box: half as sharp at 2x.
		expect(printDpi({ width: 3000, height: 2000 }, { x: 0, y: 0, w: 254, h: 169.3 }, 2)).toBeCloseTo(150, 0);
	});
});

describe("photo positions", () => {
	const photo = { w: 4000, h: 3000 };
	const box = { w: 200, h: 200 };

	it("shows the middle of the photo when centred and not zoomed", () => {
		const win = visibleWindow(photo, box, CENTERED);
		expect(win.height).toBeCloseTo(3000);
		expect(win.width).toBeCloseTo(3000);
		expect(win.left).toBeCloseTo(500);
		expect(win.top).toBeCloseTo(0);
	});

	it("shows the edges when pushed to them", () => {
		expect(visibleWindow(photo, box, { x: 0, y: 0.5, zoom: 1 }).left).toBeCloseTo(0);
		const right = visibleWindow(photo, box, { x: 1, y: 0.5, zoom: 1 });
		expect(right.left + right.width).toBeCloseTo(4000);
	});

	it("shows a smaller part of the photo when zoomed in", () => {
		const zoomed = visibleWindow(photo, box, { x: 0.5, y: 0.5, zoom: 2 });
		expect(zoomed.width).toBeCloseTo(1500);
		expect(zoomed.height).toBeCloseTo(1500);
	});

	it("moves the photo with the drag, and holds still where there is no room", () => {
		const right = panCrop(CENTERED, { dx: 0.1, dy: 0 }, photo, box);
		expect(right.x).toBeLessThan(0.5); // the photo went right, so we see more of its left
		const flat = panCrop(CENTERED, { dx: 0, dy: 0.3 }, photo, box);
		expect(flat.y).toBe(0.5); // no vertical overflow at zoom 1
		const edge = panCrop({ x: 0.02, y: 0.5, zoom: 1 }, { dx: 5, dy: 0 }, photo, box);
		expect(edge.x).toBe(0);
	});

	it("gives the same crop in CSS as in print", () => {
		const style = cropStyle({ x: 0.25, y: 0.75, zoom: 2 });
		expect(style.objectPosition).toBe("25% 75%");
		expect(style.transform).toBe("scale(2)");
		expect(style.transformOrigin).toBe("25% 75%");
		expect(cropStyle(CENTERED).transform).toBeUndefined();
	});
});

describe("book design", () => {
	const ids = Array.from({ length: 23 }, (_, i) => `p${i}`);

	it("uses every photo once, in order, when filling spreads", () => {
		const placed = spreadsFromPhotos(ids)
			.flatMap((s) => (s.kind === "pages" ? [...s.left.slots, ...s.right.slots] : []))
			.map((s) => s.itemId)
			.filter(Boolean);
		expect(placed).toEqual(ids);
	});

	it("doesn't leave a big layout nearly empty at the end", () => {
		const [spread] = spreadsFromPhotos(["a", "b", "c", "d", "e"], 7);
		if (spread.kind !== "pages") throw new Error("expected pages");
		expect(spread.left.slots.every((s) => s.itemId)).toBe(true);
	});

	it("starts a book with the first photo as cover and the rest inside", () => {
		const design = newDesign("landscape", "Wedding", ids);
		expect(design.cover.itemId).toBe("p0");
		expect(usedItemIds(design)).toEqual(ids);
		expect(pageCount(design)).toBe(design.spreads.length * 2);
		expect(bookDesignSchema.safeParse(design).success).toBe(true);
	});

	it("pads or cuts a page's slots to its layout, and drops captions where there is no room", () => {
		const page = normalizePage({ id: "x", layout: "full", slots: [slotOf("a"), slotOf("b")], caption: "hi" });
		expect(page.slots.map((s) => s.itemId)).toEqual(["a"]);
		expect(page.caption).toBe("");
		const padded = normalizePage({ id: "y", layout: "four-grid", slots: [slotOf("a")], caption: "hi" });
		expect(padded.slots.map((s) => s.itemId)).toEqual(["a", null, null, null]);
		expect(padded.caption).toBe("hi");
	});

	it("lists every spot of the book, panoramas included", () => {
		const design = newDesign("square", "t", ["a", "b", "c"]);
		design.spreads.push({ kind: "panorama", id: "pano", slot: slotOf("z") });
		expect(allSlots(design).map((s) => s.itemId)).toContain("z");
		expect(usedItemIds(design)).toContain("z");
	});

	it("refuses an unknown layout, format, zoom or an over-long book", () => {
		const good = newDesign("square", "t", ids);
		expect(bookDesignSchema.safeParse({ ...good, format: "huge" }).success).toBe(false);
		expect(bookDesignSchema.safeParse({ ...good, cover: { ...good.cover, zoom: 9 } }).success).toBe(false);
		const bad = { ...good, spreads: [{ kind: "pages", id: "a", left: { id: "l", layout: "nope", slots: [], caption: "" }, right: good.spreads[0] }] };
		expect(bookDesignSchema.safeParse(bad).success).toBe(false);
		const long = { ...good, spreads: Array.from({ length: MAX_SPREADS + 1 }, (_, i) => ({ kind: "panorama", id: `s${i}`, slot: slotOf(null) })) };
		expect(bookDesignSchema.safeParse(long).success).toBe(false);
	});

	it("reads a design saved before spreads existed, without losing a photo", () => {
		const old = {
			title: "Old",
			subtitle: "",
			format: "landscape",
			margin: "normal",
			background: "white",
			titleTone: "light",
			coverItemId: "c1",
			pages: [
				{ id: "a", layout: "single", slots: ["p1"], caption: "" },
				{ id: "b", layout: "two-side", slots: ["p2", null], caption: "x" },
				{ id: "c", layout: "single", slots: ["p3"], caption: "" },
			],
		};
		const upgraded = parseBookDesign(old);
		expect(upgraded.success).toBe(true);
		if (!upgraded.success) return;
		expect(upgraded.data.cover.itemId).toBe("c1");
		expect(upgraded.data.spreads).toHaveLength(2); // three pages become two spreads
		expect(usedItemIds(upgraded.data).sort()).toEqual(["c1", "p1", "p2", "p3"]);
		// Already-current designs pass through untouched.
		const current = newDesign("square", "t", ids);
		expect(upgradeDesign(current)).toBe(current);
	});
});

describe("the PDF", () => {
	const tinyJpeg = sharp({
		create: { width: 16, height: 16, channels: 3, background: "#3a6ea5" },
	})
		.jpeg()
		.toBuffer();

	async function build(title: string, ids: string[], fail: string[] = [], extra?: (d: ReturnType<typeof newDesign>) => void) {
		const design = newDesign("landscape", title, ids);
		extra?.(design);
		const asked: PhotoRequest[] = [];
		const jpeg = await tinyJpeg;
		const result = await buildBookPdf(design, async (request) => {
			asked.push(request);
			return fail.includes(request.itemId) ? null : jpeg;
		});
		return { design, asked, ...result, doc: await PDFDocument.load(result.bytes) };
	}

	it("has the cover and two pages per spread, each with the bleed and trim boxes set", async () => {
		const { design, doc, pages } = await build("Wedding", ["a", "b", "c", "d", "e", "f"]);
		expect(pages).toBe(1 + design.spreads.length * 2);
		const { w, h } = BOOK_SIZES_MM.landscape;
		for (const page of doc.getPages()) {
			const { width, height } = page.getSize();
			expect(width).toBeCloseTo(mmToPt(w + BLEED_MM * 2), 1);
			expect(height).toBeCloseTo(mmToPt(h + BLEED_MM * 2), 1);
			const trim = page.getTrimBox();
			expect(trim.x).toBeCloseTo(mmToPt(BLEED_MM), 1);
			expect(trim.width).toBeCloseTo(mmToPt(w), 1);
			expect(trim.height).toBeCloseTo(mmToPt(h), 1);
		}
	});

	it("asks for photos at print resolution, bleed included, with the client's crop", async () => {
		const { asked } = await build("Wedding", ["a", "b"], [], (d) => {
			d.cover = { itemId: "a", x: 0.2, y: 0.7, zoom: 1.5 };
		});
		const cover = asked.find((r) => r.itemId === "a");
		expect(cover?.widthPx).toBe(Math.round((303 / 25.4) * 300));
		expect(cover?.heightPx).toBe(Math.round((216 / 25.4) * 300));
		expect(cover?.crop).toEqual({ x: 0.2, y: 0.7, zoom: 1.5 });
	});

	it("cuts a panorama into the two pages it runs across", async () => {
		const { asked, pages } = await build("Pano", ["a"], [], (d) => {
			d.spreads = [{ kind: "panorama", id: "pano", slot: slotOf("wide") }];
		});
		expect(pages).toBe(3);
		const halves = asked.filter((r) => r.itemId === "wide");
		expect(halves).toHaveLength(2);
		const whole = Math.round(((594 + BLEED_MM * 2) / 25.4) * 300);
		const half = Math.round(((297 + BLEED_MM * 2) / 25.4) * 300);
		for (const request of halves) {
			expect(request.widthPx).toBe(whole);
			expect(request.strip?.widthPx).toBe(half);
		}
		expect(halves[0].strip?.offsetPx).toBe(0);
		expect(halves[1].strip?.offsetPx).toBe(whole - half);
	});

	it("leaves empty spots blank without asking for anything", async () => {
		const { asked } = await build("Empty", [], [], (d) => {
			d.cover = slotOf(null);
		});
		expect(asked).toHaveLength(0);
	});

	it("keeps going when a photo can't be read, and says how many were lost", async () => {
		const { missing, pages } = await build("Wedding", ["a", "b", "c"], ["b"]);
		expect(missing).toBe(1);
		expect(pages).toBeGreaterThan(1);
	});

	it("writes titles with accents, and swaps characters the PDF fonts lack", async () => {
		const { doc } = await build("Mariage d'Élodie & Karim 💍 — été 2026", ["a"]);
		expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
	});

	it("builds a book with only a cover", async () => {
		const { pages } = await build("Empty", [], [], (d) => {
			d.spreads = [];
		});
		expect(pages).toBe(1);
	});

	it("wraps a long title on two lines at most", async () => {
		const doc = await PDFDocument.create();
		const font = await doc.embedFont("Times-Bold");
		const lines = wrapText("A very long wedding title that will surely not fit on a single line of the cover at all", font, 40, 300, 2);
		expect(lines.length).toBeLessThanOrEqual(2);
		expect(lines.at(-1)?.endsWith("…")).toBe(true);
	});
});
