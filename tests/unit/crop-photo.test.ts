import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CENTERED } from "@/lib/books/crop";
import { cropPhoto } from "@/services/books/crop-photo";

/** A 4000 x 3000 photo: a red left half, a blue right half, and a green top strip. */
async function testPhoto() {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="3000">
		<rect width="2000" height="3000" fill="#ff0000"/>
		<rect x="2000" width="2000" height="3000" fill="#0000ff"/>
		<rect width="4000" height="600" fill="#00ff00"/></svg>`;
	return sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toBuffer();
}

async function pixel(jpeg: Buffer, x: number, y: number) {
	const { data, info } = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true });
	const at = (y * info.width + x) * info.channels;
	return [data[at], data[at + 1], data[at + 2]];
}

const isRed = ([r, g, b]: number[]) => r > 200 && g < 60 && b < 60;
const isBlue = ([r, g, b]: number[]) => b > 200 && r < 60 && g < 60;
const isGreen = ([r, g, b]: number[]) => g > 200 && r < 60 && b < 60;

describe("cropping a photo for print", () => {
	it("makes exactly the size asked for", async () => {
		const out = await sharp(await cropPhoto(await testPhoto(), { itemId: "a", crop: CENTERED, widthPx: 600, heightPx: 400 })).metadata();
		expect([out.width, out.height]).toEqual([600, 400]);
	});

	it("shows the middle of the photo when centred: the red and blue halves meet in the middle", async () => {
		const jpeg = await cropPhoto(await testPhoto(), { itemId: "a", crop: CENTERED, widthPx: 600, heightPx: 600 });
		expect(isRed(await pixel(jpeg, 100, 300))).toBe(true);
		expect(isBlue(await pixel(jpeg, 500, 300))).toBe(true);
	});

	it("shows the left part of the photo when pushed left, and the right part when pushed right", async () => {
		const photo = await testPhoto();
		const box = { itemId: "a", widthPx: 400, heightPx: 400 };
		const left = await cropPhoto(photo, { ...box, crop: { x: 0, y: 0.5, zoom: 1 } });
		const right = await cropPhoto(photo, { ...box, crop: { x: 1, y: 0.5, zoom: 1 } });
		// A square view of a 4:3 photo shows 3000 of its 4000 columns. Pushed left it
		// is columns 0-3000, so red/blue meet at 267 px; pushed right (1000-4000) at 133 px.
		expect(isRed(await pixel(left, 200, 200))).toBe(true);
		expect(isBlue(await pixel(right, 200, 200))).toBe(true);
	});

	it("shows the top of the photo (the green strip) when pushed up", async () => {
		const photo = await testPhoto();
		const wide = { itemId: "a", widthPx: 800, heightPx: 400 };
		const top = await cropPhoto(photo, { ...wide, crop: { x: 0.5, y: 0, zoom: 1 } });
		const bottom = await cropPhoto(photo, { ...wide, crop: { x: 0.5, y: 1, zoom: 1 } });
		expect(isGreen(await pixel(top, 400, 10))).toBe(true);
		expect(isGreen(await pixel(bottom, 400, 10))).toBe(false);
	});

	it("zooms into the part it is pointed at", async () => {
		const photo = await testPhoto();
		const box = { itemId: "a", widthPx: 400, heightPx: 300 };
		// At 3x, aimed at the right edge: only blue is left in view.
		const zoomed = await cropPhoto(photo, { ...box, crop: { x: 1, y: 0.5, zoom: 3 } });
		expect(isBlue(await pixel(zoomed, 10, 150))).toBe(true);
		expect(isBlue(await pixel(zoomed, 390, 150))).toBe(true);
		// Not zoomed: both halves show.
		const whole = await cropPhoto(photo, { ...box, crop: CENTERED });
		expect(isRed(await pixel(whole, 10, 150))).toBe(true);
		expect(isBlue(await pixel(whole, 390, 150))).toBe(true);
	});

	it("cuts a panorama into two halves that meet exactly", async () => {
		const photo = await testPhoto();
		const widthPx = 1200;
		const halfPx = 620; // each page has a little extra picture around the spine
		const request = { itemId: "a", crop: CENTERED, widthPx, heightPx: 300 };
		const left = await cropPhoto(photo, { ...request, strip: { offsetPx: 0, widthPx: halfPx } });
		const right = await cropPhoto(photo, { ...request, strip: { offsetPx: widthPx - halfPx, widthPx: halfPx } });
		const whole = await cropPhoto(photo, request);

		expect((await sharp(left).metadata()).width).toBe(halfPx);
		expect((await sharp(right).metadata()).width).toBe(halfPx);
		// The spine: the left page ends in the red half, the right page starts in the blue half...
		expect(isRed(await pixel(left, 100, 150))).toBe(true);
		expect(isBlue(await pixel(right, halfPx - 100, 150))).toBe(true);
		// ...and the same column of the whole picture appears in the same place in the halves.
		const column = widthPx - halfPx + 40; // 40 px into the right half
		const fromWhole = await pixel(whole, column, 150);
		const fromRight = await pixel(right, 40, 150);
		for (let c = 0; c < 3; c++) expect(Math.abs(fromWhole[c] - fromRight[c])).toBeLessThan(25);
	});
});
