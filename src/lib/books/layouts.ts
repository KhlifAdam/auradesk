import {
	BLEED_MM,
	BOOK_SIZES_MM,
	type BookFormat,
	type BookMargin,
	CAPTION_BAND_MM,
	MARGIN_MM,
} from "./formats";

/** A box on the page, in millimetres from its top-left trim corner. */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface Cell {
	col: number;
	row: number;
	colSpan?: number;
	rowSpan?: number;
}

interface LayoutSpec {
	/** Relative widths of the columns, and heights of the rows. */
	cols: number[];
	rows: number[];
	cells: Cell[];
	/** Edge to edge, ignoring the book's margins (and carrying no caption). */
	fullBleed?: boolean;
}

/** The ways a page can hold photos. Order is how the picker lists them. */
export const LAYOUTS = {
	full: { cols: [1], rows: [1], cells: [{ col: 0, row: 0 }], fullBleed: true },
	single: { cols: [1], rows: [1], cells: [{ col: 0, row: 0 }] },
	"two-side": {
		cols: [1, 1],
		rows: [1],
		cells: [
			{ col: 0, row: 0 },
			{ col: 1, row: 0 },
		],
	},
	"two-stack": {
		cols: [1],
		rows: [1, 1],
		cells: [
			{ col: 0, row: 0 },
			{ col: 0, row: 1 },
		],
	},
	"three-left": {
		cols: [2, 1],
		rows: [1, 1],
		cells: [
			{ col: 0, row: 0, rowSpan: 2 },
			{ col: 1, row: 0 },
			{ col: 1, row: 1 },
		],
	},
	"three-top": {
		cols: [1, 1],
		rows: [2, 1],
		cells: [
			{ col: 0, row: 0, colSpan: 2 },
			{ col: 0, row: 1 },
			{ col: 1, row: 1 },
		],
	},
	"four-grid": {
		cols: [1, 1],
		rows: [1, 1],
		cells: [
			{ col: 0, row: 0 },
			{ col: 1, row: 0 },
			{ col: 0, row: 1 },
			{ col: 1, row: 1 },
		],
	},
	"six-grid": {
		cols: [1, 1, 1],
		rows: [1, 1],
		cells: [
			{ col: 0, row: 0 },
			{ col: 1, row: 0 },
			{ col: 2, row: 0 },
			{ col: 0, row: 1 },
			{ col: 1, row: 1 },
			{ col: 2, row: 1 },
		],
	},
} as const satisfies Record<string, LayoutSpec>;

export type LayoutId = keyof typeof LAYOUTS;
export const LAYOUT_IDS = Object.keys(LAYOUTS) as [LayoutId, ...LayoutId[]];

export const slotCount = (layout: LayoutId) => LAYOUTS[layout].cells.length;
export const isFullBleed = (layout: LayoutId) =>
	"fullBleed" in LAYOUTS[layout] && LAYOUTS[layout].fullBleed;

/** Track sizes (and their start offsets) for `total` mm split by weights with gaps. */
function tracks(weights: readonly number[], total: number, gap: number) {
	const free = total - gap * (weights.length - 1);
	const sum = weights.reduce((a, b) => a + b, 0);
	let at = 0;
	return weights.map((weight) => {
		const size = (free * weight) / sum;
		const track = { start: at, size };
		at += size + gap;
		return track;
	});
}

export interface PageGeometry {
	format: BookFormat;
	margin: BookMargin;
	/** Whether the page has a caption, which takes room under the photos. */
	captioned: boolean;
}

/** Where the photos of a layout sit on a page, in mm from the trim corner. */
export function slotRects(layout: LayoutId, page: PageGeometry): Rect[] {
	const { w: pageW, h: pageH } = BOOK_SIZES_MM[page.format];
	const spec: LayoutSpec = LAYOUTS[layout];
	const { margin, gap } = spec.fullBleed
		? { margin: 0, gap: 0 }
		: MARGIN_MM[page.margin];
	const band = page.captioned && !spec.fullBleed ? CAPTION_BAND_MM : 0;
	const area = {
		x: margin,
		y: margin,
		w: pageW - margin * 2,
		h: pageH - margin * 2 - band,
	};
	const cols = tracks(spec.cols, area.w, gap);
	const rows = tracks(spec.rows, area.h, gap);

	return spec.cells.map(({ col, row, colSpan = 1, rowSpan = 1 }) => {
		const first = cols[col];
		const last = cols[col + colSpan - 1];
		const top = rows[row];
		const bottom = rows[row + rowSpan - 1];
		return {
			x: area.x + first.start,
			y: area.y + top.start,
			w: last.start + last.size - first.start,
			h: bottom.start + bottom.size - top.start,
		};
	});
}

const EDGE = 0.01;

/** Two facing pages side by side: where a panoramic photo sits. */
export function spanRect(format: BookFormat): Rect {
	const { w, h } = BOOK_SIZES_MM[format];
	return { x: 0, y: 0, w: w * 2, h };
}

/**
 * The printed box of a slot: photos touching the page edge run on into the
 * bleed. For a panorama (`span`), the box is measured on the two pages together.
 */
export function withBleed(rect: Rect, format: BookFormat, span = false): Rect {
	const { w, h: pageH } = BOOK_SIZES_MM[format];
	const pageW = span ? w * 2 : w;
	const left = rect.x <= EDGE;
	const top = rect.y <= EDGE;
	const right = rect.x + rect.w >= pageW - EDGE;
	const bottom = rect.y + rect.h >= pageH - EDGE;
	return {
		x: rect.x - (left ? BLEED_MM : 0),
		y: rect.y - (top ? BLEED_MM : 0),
		w: rect.w + (left ? BLEED_MM : 0) + (right ? BLEED_MM : 0),
		h: rect.h + (top ? BLEED_MM : 0) + (bottom ? BLEED_MM : 0),
	};
}

/**
 * How sharp a photo prints in a slot, in dots per inch. The photo is scaled
 * to cover the slot (and zoomed in), so the tighter side decides.
 */
export function printDpi(
	photo: { width: number; height: number },
	slot: Rect,
	zoom = 1,
) {
	const mmPerPixel =
		Math.max(slot.w / photo.width, slot.h / photo.height) * zoom;
	return 25.4 / mmPerPixel;
}
