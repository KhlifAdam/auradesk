import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { proofImage } from "@/lib/media/watermark";
import { jpegWithGps } from "../support/jpeg";

const picture = (width: number, height: number) =>
	sharp({ create: { width, height, channels: 3, background: "#468" } })
		.jpeg()
		.toBuffer();

describe("proofImage", () => {
	it("marks the picture and drops its metadata (so its GPS)", async () => {
		const proof = await proofImage(await jpegWithGps(), 1600, "Atelier");
		const meta = await sharp(proof).metadata();
		expect(meta.format).toBe("jpeg");
		expect(meta.exif).toBeUndefined();
	});
	it("works on pictures smaller than the mark's tile", async () => {
		for (const [w, h] of [[225, 225], [300, 168], [150, 400]])
			await expect(proofImage(await picture(w, h), 1600, "Studio")).resolves.toBeInstanceOf(Buffer);
	});
	it("shrinks to the longest edge without enlarging", async () => {
		const big = await sharp(await proofImage(await picture(3000, 2000), 1600, null)).metadata();
		expect([big.width, big.height]).toEqual([1600, 1067]);
		const small = await sharp(await proofImage(await picture(300, 200), 1600, null)).metadata();
		expect(small.width).toBe(300);
	});
	it("changes the pixels only when a label is given", async () => {
		const source = await picture(800, 600);
		const [marked, plain] = await Promise.all([
			proofImage(source, 1600, "Studio"),
			proofImage(source, 1600, null),
		]);
		expect(marked.equals(plain)).toBe(false);
	});
});
