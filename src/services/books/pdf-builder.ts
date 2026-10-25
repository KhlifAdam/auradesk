import {
	PDFDocument,
	type PDFFont,
	type PDFPage,
	rgb,
	StandardFonts,
} from "pdf-lib";
import type { Crop } from "@/lib/books/crop";
import type { BookDesign, BookSlot } from "@/lib/books/design";
import {
	BACKGROUND_HEX,
	BLEED_MM,
	BOOK_SIZES_MM,
	CAPTION_BAND_MM,
	isDarkBackground,
	MARGIN_MM,
	mmToPt,
	PRINT_DPI,
} from "@/lib/books/formats";
import {
	isFullBleed,
	type Rect,
	slotRects,
	spanRect,
	withBleed,
} from "@/lib/books/layouts";
import { printable, wrapText } from "@/lib/books/pdf-text";
import { drawCover, type PdfColor } from "./pdf-cover";

/**
 * What the builder asks for: a photo cropped to fill a box of this many
 * pixels. For one half of a panorama, `strip` says which vertical slice of
 * that box is wanted (the picture is the whole panorama, the result its half).
 */
export interface PhotoRequest {
	itemId: string;
	crop: Crop;
	widthPx: number;
	heightPx: number;
	strip?: { offsetPx: number; widthPx: number };
}

/** Returns a JPEG of the wanted size, or null when the photo can't be read. */
export type PhotoLoader = (request: PhotoRequest) => Promise<Uint8Array | null>;

function hexToRgb(hex: string) {
	const value = Number.parseInt(hex.slice(1), 16);
	return rgb(
		((value >> 16) & 255) / 255,
		((value >> 8) & 255) / 255,
		(value & 255) / 255,
	);
}

const pixels = (mm: number) => Math.max(1, Math.round((mm / 25.4) * PRINT_DPI));
const cropOf = ({ x, y, zoom }: BookSlot): Crop => ({ x, y, zoom });

/**
 * Draws a design as a print-ready PDF: every page has a 3 mm bleed, with the
 * trim and bleed boxes set so the printer knows where to cut. Photos arrive at
 * up to 300 dpi, cropped to their spot by the loader. A panorama is cut into
 * the two pages it runs across. Photos that can't be loaded leave a grey box
 * and are counted, so one bad file never loses the book.
 */
export async function buildBookPdf(design: BookDesign, loadPhoto: PhotoLoader) {
	const pdf = await PDFDocument.create();
	pdf.setTitle(printable(design.title) || "Photo book");
	pdf.setProducer("AuraDesk");
	pdf.setCreator("AuraDesk");
	const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const sans = await pdf.embedFont(StandardFonts.Helvetica);

	const { w: trimW, h: trimH } = BOOK_SIZES_MM[design.format];
	const mediaW = mmToPt(trimW + BLEED_MM * 2);
	const mediaH = mmToPt(trimH + BLEED_MM * 2);
	const background = hexToRgb(BACKGROUND_HEX[design.background]);
	const darkPage = isDarkBackground(design.background);
	let missing = 0;

	/** A new page filled with the book's colour, with its print boxes. */
	function addPage() {
		const page = pdf.addPage([mediaW, mediaH]);
		page.setTrimBox(
			mmToPt(BLEED_MM),
			mmToPt(BLEED_MM),
			mmToPt(trimW),
			mmToPt(trimH),
		);
		page.setBleedBox(0, 0, mediaW, mediaH);
		page.drawRectangle({
			x: 0,
			y: 0,
			width: mediaW,
			height: mediaH,
			color: background,
		});
		return page;
	}

	/** A box in mm from the trim's top-left corner, as PDF points from the media's bottom-left. */
	const box = (r: Rect) => ({
		x: mmToPt(BLEED_MM + r.x),
		y: mmToPt(BLEED_MM + trimH - r.y - r.h),
		width: mmToPt(r.w),
		height: mmToPt(r.h),
	});

	/** Embeds the loader's picture, or leaves a grey box (and counts it) when it can't be read. */
	async function place(
		page: PDFPage,
		slot: BookSlot,
		request: Omit<PhotoRequest, "itemId" | "crop">,
		target: ReturnType<typeof box>,
	) {
		if (!slot.itemId) return;
		const bytes = await loadPhoto({
			...request,
			itemId: slot.itemId,
			crop: cropOf(slot),
		});
		if (bytes) page.drawImage(await pdf.embedJpg(bytes), target);
		else {
			missing++;
			page.drawRectangle({ ...target, color: rgb(0.88, 0.88, 0.88) });
		}
	}

	/** One photo in its spot on a page. Empty spots stay the page's colour. */
	function drawPhoto(page: PDFPage, slot: BookSlot, spot: Rect) {
		const printed = withBleed(spot, design.format);
		return place(
			page,
			slot,
			{ widthPx: pixels(printed.w), heightPx: pixels(printed.h) },
			box(printed),
		);
	}

	/** A panoramic photo: the same picture, cut into the left and the right page. */
	async function drawPanorama(left: PDFPage, right: PDFPage, slot: BookSlot) {
		const printed = withBleed(spanRect(design.format), design.format, true);
		const widthPx = pixels(printed.w);
		const halfPx = pixels(trimW + BLEED_MM * 2);
		const whole = { x: 0, y: 0, width: mediaW, height: mediaH };
		const base = { widthPx, heightPx: pixels(printed.h) };
		await place(
			left,
			slot,
			{ ...base, strip: { offsetPx: 0, widthPx: halfPx } },
			whole,
		);
		await place(
			right,
			slot,
			{ ...base, strip: { offsetPx: widthPx - halfPx, widthPx: halfPx } },
			whole,
		);
	}

	/** Centred lines of text, the first line's middle `top` mm below the trim's top edge. */
	function drawLines(
		page: PDFPage,
		lines: string[],
		font: PDFFont,
		sizeMm: number,
		top: number,
		color: PdfColor,
	) {
		const size = mmToPt(sizeMm);
		lines.forEach((line, i) => {
			const middle = top + i * sizeMm * 1.2;
			page.drawText(line, {
				x:
					mmToPt(BLEED_MM + trimW / 2) - font.widthOfTextAtSize(line, size) / 2,
				y: mmToPt(BLEED_MM + trimH - middle) - size * 0.3,
				size,
				font,
				color,
			});
		});
	}

	await drawCover({
		page: addPage(),
		design,
		darkPage,
		fonts: { serif, sans },
		box,
		drawPhoto,
		drawLines,
	});

	/** A page's photos and caption. */
	async function drawPage(
		entry: BookDesign["spreads"][number] & { kind: "pages" },
		side: "left" | "right",
	) {
		const page = addPage();
		const content = entry[side];
		const captioned = Boolean(content.caption);
		const rects = slotRects(content.layout, {
			format: design.format,
			margin: design.margin,
			captioned,
		});
		for (const [i, rect] of rects.entries())
			await drawPhoto(page, content.slots[i], rect);
		if (captioned && !isFullBleed(content.layout)) {
			const margin = MARGIN_MM[design.margin].margin;
			const [line] = wrapText(
				content.caption,
				sans,
				mmToPt(3.4),
				mmToPt(trimW - margin * 2),
				1,
			);
			if (line)
				drawLines(
					page,
					[line],
					sans,
					3.4,
					trimH - margin - CAPTION_BAND_MM / 2,
					darkPage ? rgb(0.85, 0.85, 0.85) : rgb(0.25, 0.25, 0.25),
				);
		}
	}

	// Inside, a spread at a time, so only one photo is in memory at once.
	for (const spread of design.spreads) {
		if (spread.kind === "panorama")
			await drawPanorama(addPage(), addPage(), spread.slot);
		else {
			await drawPage(spread, "left");
			await drawPage(spread, "right");
		}
	}

	return { bytes: await pdf.save(), missing, pages: pdf.getPageCount() };
}
