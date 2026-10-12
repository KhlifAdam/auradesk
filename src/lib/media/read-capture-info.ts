import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import exifReader from "exif-reader";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const run = promisify(execFile);

/** EXIF sits in a JPEG's first segment; this covers it, even with a thumbnail. */
export const EXIF_HEAD_BYTES = 256 * 1024;

export interface CaptureInfo {
	capturedAt: Date | null;
	/** "SONY ILCE-7M4", "Apple iPhone 15 Pro"… */
	camera: string | null;
}

const NONE: CaptureInfo = { capturedAt: null, camera: null };

const validDate = (value: unknown) =>
	value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;

/** "SONY" + "ILCE-7M4", without repeating the brand when the model has it. */
function cameraName(make?: string | null, model?: string | null) {
	const brand = make?.trim() ?? "";
	const name = model?.trim() ?? "";
	if (!name) return brand || null;
	return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
		? `${brand} ${name}`
		: name;
}

/** Capture date and camera from the start of an image file. */
export async function readImageCapture(head: Buffer): Promise<CaptureInfo> {
	try {
		const { exif } = await sharp(head).metadata();
		if (!exif) return NONE;
		const tags = exifReader(exif);
		return {
			capturedAt: validDate(
				tags.Photo?.DateTimeOriginal ?? tags.Image?.DateTime,
			),
			camera: cameraName(tags.Image?.Make, tags.Image?.Model),
		};
	} catch {
		return NONE;
	}
}

/** Capture date and camera from a video's container tags (file path or URL). */
export async function readVideoCapture(input: string): Promise<CaptureInfo> {
	if (!ffmpegPath) return NONE;
	let report = "";
	try {
		await run(ffmpegPath, ["-hide_banner", "-i", input]);
	} catch (error) {
		// With no output file ffmpeg exits with an error after printing the tags.
		report = (error as { stderr?: string }).stderr ?? "";
	}
	const tag = (name: string) =>
		report.match(new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, "im"))?.[1]?.trim();
	const created = tag("creation_time");
	return {
		capturedAt: created ? validDate(new Date(created)) : null,
		camera: cameraName(
			tag("com\\.apple\\.quicktime\\.make") ?? tag("make"),
			tag("com\\.apple\\.quicktime\\.model") ?? tag("model"),
		),
	};
}
