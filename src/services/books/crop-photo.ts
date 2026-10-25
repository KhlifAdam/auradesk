import sharp from "sharp";
import { visibleWindow } from "@/lib/books/crop";
import type { PhotoRequest } from "./pdf-builder";

/** Guards against a decompression bomb posing as a photo. */
const MAX_INPUT_PIXELS = 400_000_000;
const JPEG_QUALITY = 90;

/**
 * Crops a photo exactly as the editor shows it: filling its box, zoomed and
 * moved by the client, then scaled to the pixels asked for. For half of a
 * panorama (`strip`), the whole is made first and only that slice is kept, so
 * the two halves meet exactly. Returns an sRGB JPEG.
 */
export async function cropPhoto(original: Buffer, request: PhotoRequest) {
	const { crop, widthPx, heightPx, strip } = request;
	const open = () =>
		sharp(original, { failOn: "none", limitInputPixels: MAX_INPUT_PIXELS });

	// The size after the camera's rotation is applied, which is what the client saw.
	const meta = await open().metadata();
	const turned = (meta.orientation ?? 1) >= 5;
	const photo = {
		w: (turned ? meta.height : meta.width) ?? 1,
		h: (turned ? meta.width : meta.height) ?? 1,
	};
	const window = visibleWindow(photo, { w: widthPx, h: heightPx }, crop);
	const left = Math.max(0, Math.min(photo.w - 1, Math.round(window.left)));
	const top = Math.max(0, Math.min(photo.h - 1, Math.round(window.top)));

	let pipeline = open()
		.rotate()
		.extract({
			left,
			top,
			width: Math.max(1, Math.min(photo.w - left, Math.round(window.width))),
			height: Math.max(1, Math.min(photo.h - top, Math.round(window.height))),
		})
		.resize({ width: widthPx, height: heightPx, fit: "fill" });
	if (strip)
		pipeline = pipeline.extract({
			left: strip.offsetPx,
			top: 0,
			width: strip.widthPx,
			height: heightPx,
		});
	return pipeline
		.toColorspace("srgb")
		.jpeg({ quality: JPEG_QUALITY, chromaSubsampling: "4:4:4" })
		.toBuffer();
}
