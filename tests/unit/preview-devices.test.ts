import { describe, expect, it } from "vitest";
import { fitDevice } from "@/components/dashboard/preview/devices";

describe("fitDevice", () => {
	it("lays a phone out at its real width and shrinks it to fit", () => {
		const layout = fitDevice("mobile", { width: 500, height: 625 }, 8);
		expect(layout.width).toBe(390);
		expect(layout.height).toBe(844);
		// Limited by the height: the whole phone, frame included, fits.
		const shown = layout.height * layout.scale + 2 * (layout.bezel + 8);
		expect(shown).toBeLessThanOrEqual(625 + 0.5);
	});

	it("never shows a device larger than life", () => {
		const layout = fitDevice("tablet", { width: 3000, height: 3000 }, 16);
		expect(layout.scale).toBe(1);
	});

	it("fills the box with a desktop, wider boxes showing more of the site", () => {
		const small = fitDevice("desktop", { width: 500, height: 600 }, 8);
		expect(small.width).toBe(1280);
		expect(small.width * small.scale).toBeCloseTo(500);
		expect(small.height * small.scale).toBeCloseTo(600);
		const wide = fitDevice("desktop", { width: 1600, height: 900 }, 8);
		expect(wide).toMatchObject({ width: 1600, scale: 1 });
	});

	it("survives an unmeasured box", () => {
		const layout = fitDevice("mobile", { width: 0, height: 0 }, 8);
		expect(layout.scale).toBe(0);
	});
});
