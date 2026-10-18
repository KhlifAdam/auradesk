// Reads a JPEG's metadata blocks in the browser, without decoding the image.

const START_OF_SCAN = 0xffda;
const APP1 = 0xffe1;

const IMAGE_MAKE = 0x010f;
const IMAGE_MODEL = 0x0110;
const IMAGE_DATE = 0x0132;
const EXIF_IFD = 0x8769;
const DATE_ORIGINAL = 0x9003;

/** The first bytes hold the metadata, even with a thumbnail. */
export const JPEG_HEAD_BYTES = 256 * 1024;

export interface App1Block {
	kind: "exif" | "xmp";
	/** Where the block's payload starts (after its signature) and ends. */
	start: number;
	end: number;
}

const ascii = (bytes: Uint8Array, start: number, text: string) =>
	[...text].every((char, i) => bytes[start + i] === char.charCodeAt(0));

/** The EXIF and XMP blocks of a JPEG, in file order. */
export function app1Blocks(bytes: Uint8Array): App1Block[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return [];
	const blocks: App1Block[] = [];
	let offset = 2;
	while (offset + 4 <= bytes.length) {
		const marker = view.getUint16(offset);
		// Past the headers the compressed image starts: nothing more to read.
		if (marker >> 8 !== 0xff || marker === START_OF_SCAN) break;
		const end = Math.min(bytes.length, offset + 2 + view.getUint16(offset + 2));
		if (marker === APP1) {
			if (ascii(bytes, offset + 4, "Exif\0\0"))
				blocks.push({ kind: "exif", start: offset + 10, end });
			else if (ascii(bytes, offset + 4, "http://ns.adobe.com/xap/1.0/"))
				blocks.push({ kind: "xmp", start: offset + 4, end });
		}
		offset = end;
	}
	return blocks;
}

/** Reads the entries of the TIFF block (EXIF) that starts at `tiff`. */
export function tiffReader(view: DataView, tiff: number) {
	const little = view.getUint16(tiff) === 0x4949;
	const u16 = (at: number) => view.getUint16(at, little);
	const u32 = (at: number) => view.getUint32(at, little);
	/** Entry offset of `tag` in the IFD at `ifd` (relative to tiff), or null. */
	const find = (ifd: number, tag: number) => {
		const start = tiff + ifd;
		const count = u16(start);
		for (let i = 0; i < count; i++) {
			const entry = start + 2 + i * 12;
			if (u16(entry) === tag) return entry;
		}
		return null;
	};
	const text = (entry: number | null) => {
		if (entry === null) return null;
		const count = u32(entry + 4);
		const at = count <= 4 ? entry + 8 : tiff + u32(entry + 8);
		let value = "";
		for (let i = 0; i < count; i++) {
			const code = view.getUint8(at + i);
			if (code === 0) break;
			value += String.fromCharCode(code);
		}
		return value.trim() || null;
	};
	return { little, u16, u32, ifd0: u32(tiff + 4), find, text };
}

/** "2026:09:12 14:03:51", read as UTC like the server does. */
function exifDate(value: string | null) {
	const match = value?.match(
		/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
	);
	if (!match) return null;
	const [, y, mo, d, h, mi, s] = match.map(Number);
	const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
	return Number.isNaN(date.getTime()) ? null : date;
}

/** "SONY" + "ILCE-7M4", without repeating the brand when the model has it. */
function cameraName(make: string | null, model: string | null) {
	if (!model) return make;
	return make && !model.toLowerCase().startsWith(make.toLowerCase())
		? `${make} ${model}`
		: model;
}

export interface JpegCapture {
	capturedAt: Date | null;
	camera: string | null;
}

/** When and with what a JPEG was taken, from the start of its bytes. */
export function readJpegCapture(bytes: Uint8Array): JpegCapture {
	const exif = app1Blocks(bytes).find((block) => block.kind === "exif");
	if (!exif) return { capturedAt: null, camera: null };
	try {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const tiff = tiffReader(view, exif.start);
		const exifIfd = tiff.find(tiff.ifd0, EXIF_IFD);
		const original =
			exifIfd === null
				? null
				: tiff.text(tiff.find(tiff.u32(exifIfd + 8), DATE_ORIGINAL));
		return {
			capturedAt: exifDate(
				original ?? tiff.text(tiff.find(tiff.ifd0, IMAGE_DATE)),
			),
			camera: cameraName(
				tiff.text(tiff.find(tiff.ifd0, IMAGE_MAKE)),
				tiff.text(tiff.find(tiff.ifd0, IMAGE_MODEL)),
			),
		};
	} catch {
		// A damaged or truncated block: the upload time stands in.
		return { capturedAt: null, camera: null };
	}
}
