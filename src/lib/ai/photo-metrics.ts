import "server-only";

import sharp from "sharp";

/** Images are measured at this width, so scores compare across sizes. */
const ANALYSIS_WIDTH = 512;
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;
const WHITE = 250;
const BLACK = 5;

export interface PhotoMetrics {
	sharpness: number;
	brightness: number;
	highlightsClipped: number;
	shadowsClipped: number;
	hash: string;
}

/** Variance of the 4-neighbour Laplacian: edges are crisp when it's high. */
function laplacianVariance(pixels: Uint8Array, width: number, height: number) {
	let sum = 0;
	let sumSq = 0;
	let count = 0;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const i = y * width + x;
			const value =
				pixels[i - width] +
				pixels[i + width] +
				pixels[i - 1] +
				pixels[i + 1] -
				4 * pixels[i];
			sum += value;
			sumSq += value * value;
			count++;
		}
	}
	if (count === 0) return 0;
	const mean = sum / count;
	return sumSq / count - mean * mean;
}

function exposure(pixels: Uint8Array) {
	let total = 0;
	let white = 0;
	let black = 0;
	for (const value of pixels) {
		total += value;
		if (value >= WHITE) white++;
		else if (value <= BLACK) black++;
	}
	const n = pixels.length || 1;
	return {
		brightness: total / n / 255,
		highlightsClipped: white / n,
		shadowsClipped: black / n,
	};
}

/** Difference hash: each bit says whether a pixel is brighter than its right neighbour. */
async function differenceHash(image: Buffer) {
	const pixels = await sharp(image)
		.greyscale()
		.resize(HASH_WIDTH, HASH_HEIGHT, { fit: "fill" })
		.raw()
		.toBuffer();
	let bits = "";
	for (let y = 0; y < HASH_HEIGHT; y++) {
		for (let x = 0; x < HASH_WIDTH - 1; x++) {
			const i = y * HASH_WIDTH + x;
			bits += pixels[i] > pixels[i + 1] ? "1" : "0";
		}
	}
	// 64 bits → 16 hex digits, four bits at a time.
	return (bits.match(/.{4}/g) ?? [])
		.map((nibble) => Number.parseInt(nibble, 2).toString(16))
		.join("");
}

/** Sharpness, exposure and a perceptual hash of an image. */
export async function measurePhoto(image: Buffer): Promise<PhotoMetrics> {
	const { data, info } = await sharp(image)
		.rotate()
		.greyscale()
		.resize({ width: ANALYSIS_WIDTH, withoutEnlargement: false })
		.raw()
		.toBuffer({ resolveWithObject: true });
	const pixels = new Uint8Array(data.buffer, data.byteOffset, data.length);
	return {
		sharpness: laplacianVariance(pixels, info.width, info.height),
		...exposure(pixels),
		hash: await differenceHash(image),
	};
}

/** Bits that differ between two hashes; small means near-identical images. */
export function hashDistance(a: string, b: string) {
	let count = 0;
	for (let i = 0; i < a.length; i++) {
		let diff = Number.parseInt(a[i], 16) ^ Number.parseInt(b[i] ?? "0", 16);
		while (diff) {
			count += diff & 1;
			diff >>= 1;
		}
	}
	return count;
}
