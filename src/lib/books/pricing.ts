import { z } from "zod";
import { type BookFormat, MAX_BOOK_PAGES } from "./formats";

/** Prices are in TND, to the millime. */
const money = z.number().min(0).max(99_999);
const round = (value: number) => Math.round(value * 1000) / 1000;

export const MAX_COPIES = 20;

const optionId = z.string().min(1).max(40);

/** A choice the studio offers (a cover, a paper, an extra) and what it adds per copy. */
export const priceOptionSchema = z.object({
	id: optionId,
	name: z.string().trim().min(1).max(60),
	price: money,
});

const hasUniqueIds = (items: { id: string }[]) =>
	new Set(items.map((i) => i.id)).size === items.length;

/**
 * What a studio charges for photo books. The base price covers a book of the
 * included pages; each pair of pages beyond that adds a fixed price, and the
 * cover, paper and extras the client picks add theirs. All per copy.
 */
export const priceListSchema = z
	.object({
		/** Closed until the studio turns it on: clients can design but not order. */
		enabled: z.boolean(),
		base: z.object({ square: money, landscape: money, portrait: money }),
		includedPages: z.number().int().min(2).max(MAX_BOOK_PAGES),
		extraSpreadPrice: money,
		minPages: z.number().int().min(2).max(MAX_BOOK_PAGES),
		covers: z.array(priceOptionSchema).min(1).max(10),
		papers: z.array(priceOptionSchema).min(1).max(10),
		extras: z.array(priceOptionSchema).max(10),
		/** About how long the studio needs, shown to the client. */
		leadTimeDays: z.number().int().min(0).max(180),
	})
	.refine(
		(list) =>
			hasUniqueIds(list.covers) &&
			hasUniqueIds(list.papers) &&
			hasUniqueIds(list.extras),
		"invalidInput",
	);

export type PriceList = z.infer<typeof priceListSchema>;
export type PriceOption = z.infer<typeof priceOptionSchema>;

/** Starting prices for a studio that hasn't set its own (and not open for orders yet). */
export const defaultPriceList = (): PriceList => ({
	enabled: false,
	base: { square: 90, landscape: 110, portrait: 110 },
	includedPages: 10,
	extraSpreadPrice: 10,
	minPages: 10,
	covers: [
		{ id: "softcover", name: "Softcover", price: 0 },
		{ id: "fabric", name: "Fabric hardcover", price: 25 },
		{ id: "velvet", name: "Velvet hardcover", price: 45 },
	],
	papers: [
		{ id: "matte", name: "Matte paper", price: 0 },
		{ id: "glossy", name: "Glossy paper", price: 0 },
		{ id: "silk", name: "Silk paper", price: 10 },
	],
	extras: [
		{ id: "giftbox", name: "Gift box", price: 20 },
		{ id: "engraving", name: "Engraved wooden title", price: 35 },
	],
	leadTimeDays: 14,
});

/** A stored price list, or the defaults when there is none or it no longer fits the shape. */
export function parsePriceList(raw: unknown): PriceList {
	const parsed = priceListSchema.safeParse(raw);
	return parsed.success ? parsed.data : defaultPriceList();
}

/** What the client chooses when ordering a book. */
export const bookOrderOptionsSchema = z.object({
	coverId: optionId,
	paperId: optionId,
	extraIds: z.array(optionId).max(10),
	copies: z.number().int().min(1).max(MAX_COPIES),
	note: z.string().trim().max(500),
});

export type BookOrderOptions = z.infer<typeof bookOrderOptionsSchema>;

export interface QuoteLine {
	kind: "base" | "pages" | "cover" | "paper" | "extra";
	/** The studio's own name for a cover, paper or extra. */
	name?: string;
	/** For "pages": how many extra pages. */
	count?: number;
	/** Per copy. */
	amount: number;
}

export interface Quote {
	lines: QuoteLine[];
	perCopy: number;
	copies: number;
	total: number;
}

/** A stored quote, checked on the way back out of the database. */
export const quoteSchema = z.object({
	lines: z.array(
		z.object({
			kind: z.enum(["base", "pages", "cover", "paper", "extra"]),
			name: z.string().optional(),
			count: z.number().optional(),
			amount: z.number(),
		}),
	),
	perCopy: z.number(),
	copies: z.number(),
	total: z.number(),
});

export type QuoteError =
	| "bookNotEnabled"
	| "bookTooFewPages"
	| "bookTooManyPages"
	| "bookBadOption";

/**
 * The price of a book: base price for its size, extra pages, then the picked
 * cover, paper and extras, times the copies. Run on the server for the real
 * figure; the client runs the same code to show it as they choose.
 */
export function computeQuote(
	list: PriceList,
	book: { format: BookFormat; pages: number },
	options: BookOrderOptions,
): { ok: true; quote: Quote } | { ok: false; error: QuoteError } {
	if (!list.enabled) return { ok: false, error: "bookNotEnabled" };
	if (book.pages < list.minPages)
		return { ok: false, error: "bookTooFewPages" };
	if (book.pages > MAX_BOOK_PAGES)
		return { ok: false, error: "bookTooManyPages" };

	const cover = list.covers.find((c) => c.id === options.coverId);
	const paper = list.papers.find((p) => p.id === options.paperId);
	const extras = options.extraIds.map((id) =>
		list.extras.find((e) => e.id === id),
	);
	if (
		!cover ||
		!paper ||
		extras.some((e) => !e) ||
		new Set(options.extraIds).size !== options.extraIds.length
	)
		return { ok: false, error: "bookBadOption" };

	const lines: QuoteLine[] = [{ kind: "base", amount: list.base[book.format] }];
	const extraPages = Math.max(0, book.pages - list.includedPages);
	if (extraPages > 0)
		lines.push({
			kind: "pages",
			count: extraPages,
			amount: round((extraPages / 2) * list.extraSpreadPrice),
		});
	lines.push({ kind: "cover", name: cover.name, amount: cover.price });
	lines.push({ kind: "paper", name: paper.name, amount: paper.price });
	for (const extra of extras)
		if (extra)
			lines.push({ kind: "extra", name: extra.name, amount: extra.price });

	const perCopy = round(lines.reduce((sum, line) => sum + line.amount, 0));
	return {
		ok: true,
		quote: {
			lines,
			perCopy,
			copies: options.copies,
			total: round(perCopy * options.copies),
		},
	};
}
