/** Trim sizes in millimetres: the finished page, before the printer's bleed. */
export const BOOK_FORMATS = ["square", "landscape", "portrait"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const BOOK_SIZES_MM: Record<BookFormat, { w: number; h: number }> = {
	square: { w: 210, h: 210 },
	landscape: { w: 297, h: 210 },
	portrait: { w: 210, h: 297 },
};

/** Extra picture beyond the trim edge, so a cut a little off never shows white. */
export const BLEED_MM = 3;

/** Space around a page's photos, and between them, in millimetres. */
export const BOOK_MARGINS = ["none", "tight", "normal", "airy"] as const;
export type BookMargin = (typeof BOOK_MARGINS)[number];

export const MARGIN_MM: Record<BookMargin, { margin: number; gap: number }> = {
	none: { margin: 0, gap: 0 },
	tight: { margin: 8, gap: 3 },
	normal: { margin: 14, gap: 5 },
	airy: { margin: 22, gap: 8 },
};

/** A small, print-safe palette: the page colour behind the photos. */
export const BOOK_BACKGROUNDS = [
	"white",
	"cream",
	"charcoal",
	"black",
] as const;
export type BookBackground = (typeof BOOK_BACKGROUNDS)[number];

export const BACKGROUND_HEX: Record<BookBackground, string> = {
	white: "#ffffff",
	cream: "#f6efe3",
	charcoal: "#2b2b2f",
	black: "#0b0b0c",
};

/** Whether captions on this background should be light or dark. */
export const isDarkBackground = (background: BookBackground) =>
	background === "charcoal" || background === "black";

/** Pages come in facing pairs (a spread), so a book has an even number of them. */
export const PAGES_PER_SPREAD = 2;
export const MAX_SPREADS = 30;
export const MAX_BOOK_PAGES = MAX_SPREADS * PAGES_PER_SPREAD;
export const MAX_BOOKS_PER_PROJECT = 3;
/** Room kept under a page's photos for its caption. */
export const CAPTION_BAND_MM = 10;
/** Sharp enough for print; below this a photo looks soft on paper. */
export const GOOD_DPI = 200;
export const MIN_DPI = 120;
/** The most detail the printer can use; more pixels only make a bigger file. */
export const PRINT_DPI = 300;

export const mmToPt = (mm: number) => (mm * 72) / 25.4;
