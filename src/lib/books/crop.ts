import type { CSSProperties } from "react";

/**
 * How a photo sits in its box. The photo fills the box (like `object-fit:
 * cover`), then zooms in around a point: `x` and `y` (0 to 1) say which part
 * of the photo stays lined up with the same part of the box, so 0 shows the
 * left or top edge and 1 the right or bottom one. The editor's preview and the
 * print use the same maths, so what you see is what gets printed.
 */
export interface Crop {
	x: number;
	y: number;
	zoom: number;
}

export const CENTERED: Crop = { x: 0.5, y: 0.5, zoom: 1 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export const clampCrop = (crop: Crop): Crop => ({
	x: clamp(crop.x, 0, 1),
	y: clamp(crop.y, 0, 1),
	zoom: clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM),
});

interface Size {
	w: number;
	h: number;
}

/** Box units covered by one pixel of the photo: it fills the box, then zoom enlarges it. */
const mmPerPixel = (photo: Size, box: Size, zoom: number) =>
	Math.max(box.w / photo.w, box.h / photo.h) * zoom;

/** The part of the photo, in its own pixels, that shows in the box. */
export function visibleWindow(photo: Size, box: Size, crop: Crop) {
	const scale = mmPerPixel(photo, box, crop.zoom);
	const width = box.w / scale;
	const height = box.h / scale;
	return {
		left: (photo.w - width) * crop.x,
		top: (photo.h - height) * crop.y,
		width,
		height,
	};
}

/**
 * The crop after dragging the photo by a fraction of the box's width and
 * height (positive = the photo moved right or down). Without room to move
 * along an axis, that axis stays put.
 */
export function panCrop(
	crop: Crop,
	move: { dx: number; dy: number },
	photo: Size,
	box: Size,
): Crop {
	const scale = mmPerPixel(photo, box, crop.zoom);
	const overflowX = photo.w - box.w / scale;
	const overflowY = photo.h - box.h / scale;
	const x =
		overflowX > 0.5 ? crop.x - (move.dx * box.w) / scale / overflowX : crop.x;
	const y =
		overflowY > 0.5 ? crop.y - (move.dy * box.h) / scale / overflowY : crop.y;
	return clampCrop({ ...crop, x, y });
}

/** CSS that shows a photo the way the print crops it. */
export function cropStyle(crop: Crop): CSSProperties {
	const origin = `${crop.x * 100}% ${crop.y * 100}%`;
	return {
		objectPosition: origin,
		transformOrigin: origin,
		transform: crop.zoom === 1 ? undefined : `scale(${crop.zoom})`,
	};
}
