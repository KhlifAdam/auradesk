import type { PDFFont } from "pdf-lib";

/** The characters PDF's standard fonts can draw (Western European + common punctuation). */
const UNSUPPORTED = /[^\x20-\x7e -ÿ€’‘“”–—…•]/g;

/** Text the standard fonts can write: anything else becomes a question mark. */
export const printable = (text: string) =>
	text.replace(/\s+/g, " ").trim().replace(UNSUPPORTED, "?");

/**
 * Greedy word wrap into at most `maxLines` lines no wider than `maxWidth`; the
 * last line ends in an ellipsis when the text didn't fit.
 */
export function wrapText(
	text: string,
	font: PDFFont,
	size: number,
	maxWidth: number,
	maxLines: number,
) {
	const lines: string[] = [];
	let line = "";
	for (const word of printable(text).split(" ").filter(Boolean)) {
		const next = line ? `${line} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next;
		else {
			lines.push(line);
			line = word;
		}
	}
	if (line) lines.push(line);
	if (lines.length <= maxLines) return lines;
	let last = lines[maxLines - 1];
	while (last.length > 1 && font.widthOfTextAtSize(`${last}…`, size) > maxWidth)
		last = last.slice(0, -1);
	return [...lines.slice(0, maxLines - 1), `${last}…`];
}
