import { describe, expect, it, vi } from "vitest";

// Only the pure rules are tested: no database or emails.
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/services/projects/stage-notices", () => ({
	notifyStageChange: vi.fn(),
}));

const { stageForGalleryEvent } = await import(
	"@/services/projects/auto-stage"
);

describe("stageForGalleryEvent", () => {
	it("moves to Import when the first photos arrive", () => {
		expect(stageForGalleryEvent("uploaded", "PROOFS", "BOOKING")).toBe(
			"IMPORT",
		);
		expect(stageForGalleryEvent("uploaded", "FINAL", "SHOOTING")).toBe(
			"IMPORT",
		);
	});

	it("treats finals uploaded after the client chose as the export", () => {
		expect(stageForGalleryEvent("uploaded", "FINAL", "SELECTION")).toBe(
			"EXPORT",
		);
		expect(stageForGalleryEvent("uploaded", "FINAL", "POST_PRODUCTION")).toBe(
			"EXPORT",
		);
		// Proofs never mean the edit is done.
		expect(stageForGalleryEvent("uploaded", "PROOFS", "POST_PRODUCTION")).toBe(
			"IMPORT",
		);
	});

	it("maps organizing and sharing to their steps", () => {
		expect(stageForGalleryEvent("organized", "PROOFS", "IMPORT")).toBe(
			"ORGANIZATION",
		);
		expect(stageForGalleryEvent("shared", "PROOFS", "ORGANIZATION")).toBe(
			"SELECTION",
		);
		expect(stageForGalleryEvent("shared", "FINAL", "EXPORT")).toBe(
			"VALIDATION",
		);
	});
});
