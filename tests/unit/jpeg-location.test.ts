import exifReader from "exif-reader";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { readJpegCapture } from "@/lib/media/jpeg-metadata";
import { blankJpegLocation } from "@/lib/media/strip-location";
import { jpegWithGps } from "../support/jpeg";

const exifOf = async (bytes: Uint8Array) => {
	const { exif, xmp } = await sharp(Buffer.from(bytes)).metadata();
	return { tags: exif ? exifReader(exif) : null, xmp: xmp?.toString() ?? "" };
};

describe("readJpegCapture", () => {
	it("reads the date and camera like the server does", async () => {
		const capture = readJpegCapture(new Uint8Array(await jpegWithGps()));
		expect(capture.camera).toBe("SONY ILCE-7M4");
		expect(capture.capturedAt?.toISOString()).toBe("2026-09-12T14:03:51.000Z");
	});
	it("returns nothing for files without EXIF or not JPEG", () => {
		expect(readJpegCapture(new Uint8Array([1, 2, 3]))).toEqual({
			capturedAt: null,
			camera: null,
		});
	});
});

describe("blankJpegLocation", () => {
	it("removes GPS from EXIF and XMP, keeping size, pixels and camera", async () => {
		const original = await jpegWithGps();
		const bytes = new Uint8Array(original);
		expect(blankJpegLocation(bytes)).toBe(true);
		expect(bytes.length).toBe(original.length);

		const after = await exifOf(bytes);
		expect(after.tags?.GPSInfo ?? {}).toEqual({});
		expect(after.xmp).not.toMatch(/GPSLatitude/);
		expect(after.tags?.Image?.Model).toBe("ILCE-7M4");

		const [before, now] = await Promise.all([
			sharp(original).raw().toBuffer(),
			sharp(Buffer.from(bytes)).raw().toBuffer(),
		]);
		expect(now.equals(before)).toBe(true);
	});
	it("says so when there was nothing to remove", async () => {
		const plain = await sharp({
			create: { width: 4, height: 4, channels: 3, background: "#000" },
		})
			.jpeg()
			.toBuffer();
		expect(blankJpegLocation(new Uint8Array(plain))).toBe(false);
	});
});
