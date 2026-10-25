import { describe, expect, it } from "vitest";
import {
	addWorkDays,
	type EstimateInput,
	estimateProject,
} from "@/lib/projects/estimate";

const today = new Date("2026-10-26T09:00:00Z"); // a Monday

const input = (patch: Partial<EstimateInput> = {}): EstimateInput => ({
	stage: "POST_PRODUCTION",
	serviceType: "WEDDING",
	mediaType: "PHOTO",
	eventDate: new Date("2026-10-20T00:00:00Z"),
	deliveryDeadline: null,
	media: { proofs: 0, finals: 0, selected: 0, videos: 0 },
	history: { medianDays: null, samples: 0 },
	workload: 0,
	today,
	...patch,
});

describe("estimateProject", () => {
	it("is done once delivered", () => {
		const e = estimateProject(input({ stage: "DELIVERY" }));
		expect(e.done).toBe(true);
		expect(e.hoursLeft).toBe(0);
	});

	it("only counts the work still ahead of the stage", () => {
		const early = estimateProject(input({ stage: "IMPORT" }));
		const late = estimateProject(input({ stage: "EXPORT" }));
		expect(early.tasks.map((t) => t.key)).toEqual([
			"import",
			"culling",
			"retouching",
			"export",
		]);
		expect(late.tasks.map((t) => t.key)).toEqual(["export"]);
		expect(late.hoursLeft).toBeLessThan(early.hoursLeft);
	});

	it("uses the client's selection as the photos to retouch", () => {
		const e = estimateProject(
			input({ media: { proofs: 900, finals: 0, selected: 120, videos: 0 } }),
		);
		expect(e.assumed).toMatchObject({ photos: 120, fromFiles: true });
		expect(e.tasks.find((t) => t.key === "retouching")?.hours).toBe(5);
	});

	it("adds video editing for video projects", () => {
		const photo = estimateProject(input());
		const both = estimateProject(input({ mediaType: "BOTH" }));
		expect(photo.tasks.some((t) => t.key === "videoEditing")).toBe(false);
		expect(both.tasks.find((t) => t.key === "videoEditing")?.hours).toBe(20);
		expect(both.hoursLeft).toBeGreaterThan(photo.hoursLeft);
	});

	it("takes longer when the studio is busy", () => {
		const free = estimateProject(input());
		const busy = estimateProject(input({ workload: 4 }));
		expect(busy.daysLeft).toBeGreaterThan(free.daysLeft);
	});

	it("waits for the shoot, then the client's selection and approval", () => {
		const e = estimateProject(
			input({ stage: "PREP", eventDate: new Date("2026-11-02T00:00:00Z") }),
		);
		expect(e.waits).toEqual([
			{ key: "shoot", days: 7 },
			{ key: "selection", days: 3 },
			{ key: "validation", days: 2 },
		]);
		expect(e.finishDate > "2026-11-02").toBe(true);
	});

	it("flags a deadline the work can't meet", () => {
		const late = estimateProject(
			input({ deliveryDeadline: new Date("2026-10-27T00:00:00Z") }),
		);
		const fine = estimateProject(
			input({ deliveryDeadline: new Date("2026-12-31T00:00:00Z") }),
		);
		expect(late.deadline?.status).toBe("late");
		expect(fine.deadline?.status).toBe("onTrack");
	});

	it("blends in the studio's usual turnaround when it knows it", () => {
		const e = estimateProject(
			input({ history: { medianDays: 40, samples: 6 } }),
		);
		expect(e.basis).toBe("blended");
		expect(e.confidence).toBe("high");
	});
});

describe("addWorkDays", () => {
	it("skips Sundays", () => {
		// Saturday + 1 working day lands on Monday.
		expect(
			addWorkDays(new Date("2026-10-31T10:00:00Z"), 1)
				.toISOString()
				.slice(0, 10),
		).toBe("2026-11-02");
	});
});
