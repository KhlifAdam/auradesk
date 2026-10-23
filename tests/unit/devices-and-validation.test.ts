import { describe, expect, it } from "vitest";
import { describeDevice } from "@/lib/user-agent";
import { privacySettingsSchema } from "@/services/privacy/schemas";
import { shareLinkSchema, startProofSchema } from "@/services/galleries/schemas";

describe("describeDevice", () => {
	it("names browser and system", () => {
		expect(
			describeDevice(
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0",
			),
		).toEqual({ browser: "Edge", os: "Windows", mobile: false });
		expect(
			describeDevice(
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1",
			),
		).toEqual({ browser: "Safari", os: "iOS", mobile: true });
	});
	it("stays unknown without a header", () => {
		expect(describeDevice(null)).toEqual({ browser: null, os: null, mobile: false });
	});
});

describe("validation", () => {
	it("accepts only the offered share link lengths", () => {
		const base = { galleryId: "g1", downloads: false };
		expect(shareLinkSchema.safeParse({ ...base, expiresInDays: 7 }).success).toBe(true);
		expect(shareLinkSchema.safeParse({ ...base, expiresInDays: 3 }).success).toBe(false);
	});
	it("takes only photos into a proofs gallery", () => {
		const proof = {
			galleryId: "g1",
			filename: "a.jpg",
			originalSize: 1000,
			originalModifiedAt: 1,
			proofSize: 500,
		};
		expect(startProofSchema.safeParse({ ...proof, mimeType: "image/jpeg" }).success).toBe(true);
		expect(startProofSchema.safeParse({ ...proof, mimeType: "video/mp4" }).success).toBe(false);
	});
	it("offers only the listed gallery retention periods", () => {
		expect(privacySettingsSchema.safeParse({ retention: "12", stripLocation: true }).success).toBe(true);
		expect(privacySettingsSchema.safeParse({ retention: "5", stripLocation: true }).success).toBe(false);
	});
});
