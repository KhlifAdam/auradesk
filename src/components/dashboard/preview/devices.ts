import { Monitor, Smartphone, Tablet } from "lucide-react";
import {
	PREVIEW_DEVICES,
	type PreviewDevice,
} from "@/services/preview/preview-params";

/**
 * Screens the site can be previewed on. The site is laid out at the device's
 * real width (so its own breakpoints apply), then scaled to fit the space.
 */
export const DEVICES = {
	desktop: { width: 1280, height: null, bezel: 0, radius: 12, icon: Monitor },
	tablet: { width: 820, height: 1180, bezel: 12, radius: 28, icon: Tablet },
	mobile: { width: 390, height: 844, bezel: 10, radius: 40, icon: Smartphone },
} as const satisfies Record<PreviewDevice, unknown>;

export type Device = PreviewDevice;
export const DEVICE_IDS = PREVIEW_DEVICES;

export interface DeviceLayout {
	/** The site's own (unscaled) viewport. */
	width: number;
	height: number;
	scale: number;
	/** Device border around the screen, in on-screen pixels. */
	bezel: number;
	radius: number;
}

/**
 * Fits a device into a box. A desktop fills the box (wider boxes show more
 * of the site, never less than its minimum width); a tablet or phone keeps
 * its proportions, centred, at the same scale (never larger than life).
 */
export function fitDevice(
	device: Device,
	box: { width: number; height: number },
	margin: number,
): DeviceLayout {
	const spec = DEVICES[device];
	if (spec.height === null) {
		const width = Math.max(box.width, spec.width);
		const scale = box.width / width;
		return {
			width,
			height: scale > 0 ? box.height / scale : 0,
			scale,
			bezel: 0,
			radius: spec.radius,
		};
	}
	// Tablet and phone share the tablet's scale, so they keep their real
	// sizes next to each other: the phone is clearly the smaller screen.
	const tablet = DEVICES.tablet;
	const room = (size: number) =>
		Math.max(0, size - 2 * (margin + tablet.bezel));
	const scale = Math.min(
		1,
		room(box.width) / tablet.width,
		room(box.height) / tablet.height,
	);
	// Small previews get a thinner frame, so it doesn't eat the screen.
	const shrink = Math.min(1, scale * 2);
	return {
		width: spec.width,
		height: spec.height,
		scale,
		bezel: Math.max(3, Math.round(spec.bezel * shrink)),
		radius: Math.round(spec.radius * shrink),
	};
}
