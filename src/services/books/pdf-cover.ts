import { type PDFFont, type PDFPage, rgb } from "pdf-lib";
import { coverGeometry } from "@/lib/books/cover";
import type { BookDesign, BookSlot } from "@/lib/books/design";
import { BLEED_MM, BOOK_SIZES_MM, mmToPt } from "@/lib/books/formats";
import type { Rect } from "@/lib/books/layouts";
import { wrapText } from "@/lib/books/pdf-text";

export type PdfColor = ReturnType<typeof rgb>;

export interface CoverContext {
	page: PDFPage;
	design: BookDesign;
	/** The book's colour is dark: text over it is light. */
	darkPage: boolean;
	fonts: { serif: PDFFont; sans: PDFFont };
	/** A box in mm from the trim's top-left, as PDF points. */
	box: (rect: Rect) => { x: number; y: number; width: number; height: number };
	drawPhoto: (page: PDFPage, slot: BookSlot, spot: Rect) => Promise<void>;
	drawLines: (
		page: PDFPage,
		lines: string[],
		font: PDFFont,
		sizeMm: number,
		top: number,
		color: PdfColor,
	) => void;
}

/** The cover: its photo edge to edge, the title and subtitle in a band along the bottom. */
export async function drawCover(c: CoverContext) {
	const { page, design, fonts } = c;
	const { w: trimW, h: trimH } = BOOK_SIZES_MM[design.format];
	const g = coverGeometry(design.format);

	await c.drawPhoto(page, design.cover, { x: 0, y: 0, w: trimW, h: trimH });
	const onPhoto = Boolean(design.cover.itemId);
	const lightText = onPhoto ? design.titleTone === "light" : c.darkPage;
	if (onPhoto && (design.title || design.subtitle))
		page.drawRectangle({
			...c.box({
				x: -BLEED_MM,
				y: trimH - g.bandHeight,
				w: trimW + BLEED_MM * 2,
				h: g.bandHeight + BLEED_MM,
			}),
			color: lightText ? rgb(0, 0, 0) : rgb(1, 1, 1),
			opacity: g.bandOpacity,
		});

	const color = lightText ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1);
	const wrap = (text: string, font: PDFFont, sizeMm: number) =>
		wrapText(text, font, mmToPt(sizeMm), mmToPt(g.textWidth), 2);
	const title = wrap(design.title, fonts.serif, g.titleSize);
	const subtitle = wrap(design.subtitle, fonts.sans, g.subtitleSize);
	const titleHeight = title.length * g.titleSize * 1.2;
	const subtitleHeight = subtitle.length * g.subtitleSize * 1.2;
	const gap = subtitle.length ? g.subtitleSize * 0.6 : 0;
	// The whole text block sits in the middle of the band.
	const top =
		trimH - g.bandHeight / 2 - (titleHeight + gap + subtitleHeight) / 2;
	c.drawLines(
		page,
		title,
		fonts.serif,
		g.titleSize,
		top + (g.titleSize * 1.2) / 2,
		color,
	);
	c.drawLines(
		page,
		subtitle,
		fonts.sans,
		g.subtitleSize,
		top + titleHeight + gap + (g.subtitleSize * 1.2) / 2,
		color,
	);
}
