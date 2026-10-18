// Removes where a JPEG was taken without touching its pixels: the GPS block
// of the EXIF and the GPS fields of the XMP are overwritten in place. The
// file keeps its exact size and every other tag (orientation, date, camera).

import { app1Blocks, tiffReader } from "./jpeg-metadata";

const GPS_IFD_TAG = 0x8825;
/** Bytes per value of each TIFF field type. */
const TYPE_SIZES: Record<number, number> = {
	1: 1,
	2: 1,
	3: 2,
	4: 4,
	5: 8,
	6: 1,
	7: 1,
	8: 2,
	9: 4,
	10: 8,
	11: 4,
	12: 8,
};
/** `exif:GPSLatitude="…"` or `<exif:GPSLatitude>…</exif:GPSLatitude>` in XMP. */
const XMP_GPS = /exif:GPS\w+="[^"]*"|<exif:GPS(\w+)>[^<]*<\/exif:GPS\1>/g;

/** Empties the GPS IFD of the TIFF block that starts at `tiff`. */
function blankExifGps(view: DataView, tiff: number, end: number) {
	const { little, u16, u32, ifd0, find } = tiffReader(view, tiff);
	const pointer = find(ifd0, GPS_IFD_TAG);
	if (pointer === null) return false;
	const gps = tiff + u32(pointer + 8);
	const count = u16(gps);
	if (gps + 2 + count * 12 > end) return false;
	for (let j = 0; j < count; j++) {
		const field = gps + 2 + j * 12;
		const size = (TYPE_SIZES[u16(field + 2)] ?? 1) * u32(field + 4);
		// Values over 4 bytes live elsewhere in the block: blank them too.
		if (size > 4) {
			const data = tiff + u32(field + 8);
			if (data + size <= end)
				for (let k = 0; k < size; k++) view.setUint8(data + k, 0);
		}
		for (let k = 0; k < 12; k++) view.setUint8(field + k, 0);
	}
	view.setUint16(gps, 0, little);
	return count > 0;
}

/** Overwrites XMP GPS fields with spaces, which keeps the packet's length. */
function blankXmpGps(bytes: Uint8Array, start: number, end: number) {
	// One char per byte, so match positions are byte positions. In chunks:
	// a packet can reach 64 KB, too many arguments for a single call.
	let text = "";
	for (let i = start; i < end; i += 8192)
		text += String.fromCharCode(...bytes.subarray(i, Math.min(end, i + 8192)));
	let changed = false;
	for (const match of text.matchAll(XMP_GPS)) {
		bytes.fill(
			0x20,
			start + match.index,
			start + match.index + match[0].length,
		);
		changed = true;
	}
	return changed;
}

/** Blanks the location in a JPEG's bytes, in place. True if there was one. */
export function blankJpegLocation(bytes: Uint8Array) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let changed = false;
	for (const block of app1Blocks(bytes)) {
		const blanked =
			block.kind === "exif"
				? blankExifGps(view, block.start, block.end)
				: blankXmpGps(bytes, block.start, block.end);
		changed = blanked || changed;
	}
	return changed;
}

/**
 * The file without its location when it is a JPEG that had one; otherwise
 * the file itself. Anything unexpected leaves the file untouched.
 */
export async function withoutLocation(file: File): Promise<File> {
	if (file.type !== "image/jpeg") return file;
	try {
		const bytes = new Uint8Array(await file.arrayBuffer());
		if (!blankJpegLocation(bytes)) return file;
		return new File([bytes], file.name, {
			type: file.type,
			lastModified: file.lastModified,
		});
	} catch {
		return file;
	}
}
