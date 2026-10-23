// Public-site photos never need a camera's full resolution: a 24-megapixel
// original is 5–8 MB and slow to serve. Larger photos are scaled down in the
// browser before upload. Re-encoding also drops their metadata (GPS included);
// the browser applies the EXIF orientation first, so they stay upright.

/** Longest side kept: sharp on large retina screens, ~1 MB as a JPEG. */
export const WEB_MAX_EDGE = 3000;
const QUALITY = 0.9;
/** Formats the browser can re-encode (AVIF and GIF are left as they are). */
const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

async function encode(
	bitmap: ImageBitmap,
	width: number,
	height: number,
	type: string,
): Promise<Blob | null> {
	if (typeof OffscreenCanvas !== "undefined") {
		const canvas = new OffscreenCanvas(width, height);
		canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
		return canvas.convertToBlob({ type, quality: QUALITY });
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
	return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** The photo at web size, or the file itself when it is already small enough. */
export async function resizeForWeb(
	file: File,
	maxEdge = WEB_MAX_EDGE,
): Promise<File> {
	if (!RESIZABLE.has(file.type)) return file;
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return file; // Unreadable here: let the server decide.
	}
	try {
		const scale = maxEdge / Math.max(bitmap.width, bitmap.height);
		if (scale >= 1) return file;
		const width = Math.round(bitmap.width * scale);
		const height = Math.round(bitmap.height * scale);
		const blob = await encode(bitmap, width, height, file.type);
		// Keep the original if encoding failed or didn't save anything.
		if (!blob || blob.size >= file.size) return file;
		return new File([blob], file.name, {
			type: file.type,
			lastModified: file.lastModified,
		});
	} finally {
		bitmap.close();
	}
}
