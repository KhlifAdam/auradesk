import { describe, expect, it } from "vitest";
import {
	bookOrderOptionsSchema,
	computeQuote,
	defaultPriceList,
	parsePriceList,
	priceListSchema,
} from "@/lib/books/pricing";

const open = () => ({ ...defaultPriceList(), enabled: true });
const options = (patch = {}) => ({
	coverId: "softcover",
	paperId: "matte",
	extraIds: [] as string[],
	copies: 1,
	note: "",
	...patch,
});

describe("photo book prices", () => {
	it("charges the base price for a book with the included pages", () => {
		const result = computeQuote(open(), { format: "landscape", pages: 10 }, options());
		expect(result).toMatchObject({ ok: true, quote: { perCopy: 110, total: 110, copies: 1 } });
	});

	it("charges the studio's price for each size", () => {
		const total = (format: "square" | "landscape" | "portrait") => {
			const r = computeQuote(open(), { format, pages: 10 }, options());
			return r.ok ? r.quote.perCopy : -1;
		};
		expect([total("square"), total("landscape"), total("portrait")]).toEqual([90, 110, 110]);
	});

	it("adds the price of extra pages, per pair of pages", () => {
		const r = computeQuote(open(), { format: "square", pages: 16 }, options());
		// 6 pages over the 10 included = 3 spreads at 10 each.
		expect(r).toMatchObject({ ok: true, quote: { perCopy: 120 } });
		if (r.ok) expect(r.quote.lines.find((l) => l.kind === "pages")).toMatchObject({ count: 6, amount: 30 });
	});

	it("adds the cover, paper and extras the client picks, and multiplies by the copies", () => {
		const r = computeQuote(
			open(),
			{ format: "landscape", pages: 10 },
			options({ coverId: "velvet", paperId: "silk", extraIds: ["giftbox", "engraving"], copies: 3 }),
		);
		// 110 + 45 + 10 + 20 + 35 = 220 per copy.
		expect(r).toMatchObject({ ok: true, quote: { perCopy: 220, total: 660, copies: 3 } });
		if (r.ok) expect(r.quote.lines.map((l) => l.kind)).toEqual(["base", "cover", "paper", "extra", "extra"]);
	});

	it("keeps millimes exact", () => {
		const list = open();
		list.base.square = 10.1;
		list.extraSpreadPrice = 0.333;
		const r = computeQuote(list, { format: "square", pages: 12 }, options({ copies: 3 }));
		expect(r).toMatchObject({ ok: true, quote: { perCopy: 10.433, total: 31.299 } });
	});

	it("refuses to quote while the studio hasn't opened book orders", () => {
		const r = computeQuote(defaultPriceList(), { format: "square", pages: 10 }, options());
		expect(r).toEqual({ ok: false, error: "bookNotEnabled" });
	});

	it("refuses a book with too few pages", () => {
		const r = computeQuote(open(), { format: "square", pages: 8 }, options());
		expect(r).toEqual({ ok: false, error: "bookTooFewPages" });
	});

	it("refuses options the studio doesn't offer, or the same extra twice", () => {
		const book = { format: "square" as const, pages: 10 };
		expect(computeQuote(open(), book, options({ coverId: "gold" }))).toEqual({ ok: false, error: "bookBadOption" });
		expect(computeQuote(open(), book, options({ paperId: "gold" }))).toEqual({ ok: false, error: "bookBadOption" });
		expect(computeQuote(open(), book, options({ extraIds: ["nope"] }))).toEqual({ ok: false, error: "bookBadOption" });
		expect(computeQuote(open(), book, options({ extraIds: ["giftbox", "giftbox"] }))).toEqual({ ok: false, error: "bookBadOption" });
	});

	it("validates what the client sends", () => {
		expect(bookOrderOptionsSchema.safeParse(options()).success).toBe(true);
		expect(bookOrderOptionsSchema.safeParse(options({ copies: 0 })).success).toBe(false);
		expect(bookOrderOptionsSchema.safeParse(options({ copies: 99 })).success).toBe(false);
		expect(bookOrderOptionsSchema.safeParse(options({ note: "x".repeat(501) })).success).toBe(false);
	});

	it("validates the studio's price list, and falls back to the defaults for a bad one", () => {
		expect(priceListSchema.safeParse(defaultPriceList()).success).toBe(true);
		const dupes = { ...defaultPriceList(), covers: [{ id: "a", name: "A", price: 1 }, { id: "a", name: "B", price: 2 }] };
		expect(priceListSchema.safeParse(dupes).success).toBe(false);
		expect(priceListSchema.safeParse({ ...defaultPriceList(), covers: [] }).success).toBe(false);
		expect(priceListSchema.safeParse({ ...defaultPriceList(), extraSpreadPrice: -1 }).success).toBe(false);
		expect(parsePriceList({ nonsense: true })).toEqual(defaultPriceList());
		expect(parsePriceList(null).enabled).toBe(false);
	});
});
