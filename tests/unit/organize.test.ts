import { describe, expect, it } from "vitest";
import {
	extensionOf,
	organizedName,
	prefixFromTitle,
	prefixSchema,
} from "@/services/galleries/organize";

describe("organizedName", () => {
	it("is prefix, shooting day, then position", () => {
		const taken = new Date("2026-09-12T14:03:51Z");
		expect(organizedName("mariage", taken, 0, "jpg")).toBe("mariage_20260912_0001.jpg");
		expect(organizedName("mariage", taken, 41, "")).toBe("mariage_20260912_0042");
	});
});

describe("prefixFromTitle", () => {
	it("makes a file-safe prefix without accents", () => {
		expect(prefixFromTitle("Mariage Ben Ali")).toBe("mariage-ben-ali");
		expect(prefixFromTitle("Séance été 2026 !")).toBe("seance-ete-2026");
	});
	it("falls back when nothing usable is left", () => {
		expect(prefixFromTitle("!!!")).toBe("gallery");
	});
});

describe("extensionOf / prefixSchema", () => {
	it("reads the lower-case extension", () => {
		expect(extensionOf("DSC0001.JPG")).toBe("jpg");
		expect(extensionOf("no-extension")).toBe("");
	});
	it("refuses spaces and slashes in a prefix", () => {
		expect(prefixSchema.safeParse("mariage-ben_ali").success).toBe(true);
		expect(prefixSchema.safeParse("bad name").success).toBe(false);
		expect(prefixSchema.safeParse("a/b").success).toBe(false);
	});
});
