import { BOOK_SIZES_MM, type BookFormat } from "./formats";

/**
 * The cover's text block, in millimetres: a band across the bottom with the
 * title and subtitle centred in it. Shared by the editor's preview and the PDF.
 */
export function coverGeometry(format: BookFormat) {
	const { w, h } = BOOK_SIZES_MM[format];
	const base = Math.min(w, h);
	return {
		/** Height of the band behind the text, from the bottom edge. */
		bandHeight: h * 0.26,
		titleSize: base * 0.07,
		subtitleSize: base * 0.032,
		/** Text wraps inside this width. */
		textWidth: w * 0.82,
		/** The band's strength over a photo. */
		bandOpacity: 0.38,
	};
}
