import { describe, expect, it } from "vitest";
import {
	PLAN_LIMITS,
	type PlanLimits,
	pricePerMonth,
	pricePerPeriod,
	storageBytesOf,
	storageGbOf,
} from "@/services/billing/plans";
import { addMonths, subscriptionState } from "@/services/billing/status";

const now = new Date("2026-10-23T12:00:00");

describe("subscriptionState", () => {
	it("is in its free month until the trial ends", () => {
		const state = subscriptionState(
			{ trialEndsAt: new Date("2026-11-05T12:00:00"), paidUntil: null },
			now,
		);
		expect(state).toMatchObject({ status: "trial", daysLeft: 13 });
	});

	it("counts a paid period over the trial", () => {
		const paidUntil = new Date("2026-12-01T00:00:00");
		const state = subscriptionState(
			{ trialEndsAt: new Date("2026-10-01"), paidUntil },
			now,
		);
		expect(state.status).toBe("active");
		expect(state.endsAt).toEqual(paidUntil);
	});

	it("is over once both the trial and the paid period are past", () => {
		const state = subscriptionState(
			{
				trialEndsAt: new Date("2026-09-01"),
				paidUntil: new Date("2026-10-01"),
			},
			now,
		);
		expect(state).toMatchObject({ status: "expired", daysLeft: 0 });
	});
});

describe("addMonths", () => {
	it("keeps the day, clamped to shorter months", () => {
		expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
		expect(addMonths(new Date(2026, 9, 23), 12)).toEqual(new Date(2027, 9, 23));
	});
});

describe("prices", () => {
	it("charges 20% less per month on yearly billing", () => {
		expect(pricePerMonth("PRO", "MONTHLY")).toBe(59);
		expect(pricePerMonth("PRO", "YEARLY")).toBe(47);
		expect(pricePerPeriod("PRO", "YEARLY")).toBe(564);
		expect(pricePerPeriod("STARTER", "MONTHLY")).toBe(29);
	});
});

describe("storage packs", () => {
	it("adds 10 DT a month per 100 GB pack, discounted yearly", () => {
		expect(pricePerMonth("PRO", "MONTHLY", 2)).toBe(79);
		expect(pricePerMonth("PRO", "YEARLY", 2)).toBe(63);
		expect(pricePerPeriod("STARTER", "YEARLY", 1)).toBe(372);
	});

	it("adds the packs to the plan's storage", () => {
		expect(storageGbOf("PRO", 3)).toBe(600);
		expect(storageBytesOf("STARTER", 1)).toBe(150e9);
	});
});

describe("plan limits", () => {
	it("gives more of everything on each higher plan", () => {
		for (const key of Object.keys(PLAN_LIMITS.STARTER) as (keyof PlanLimits)[]) {
			expect(PLAN_LIMITS.PRO[key]).toBeGreaterThan(PLAN_LIMITS.STARTER[key]);
			expect(PLAN_LIMITS.STUDIO[key]).toBeGreaterThan(PLAN_LIMITS.PRO[key]);
		}
	});

	it("converts storage to bytes", () => {
		expect(storageBytesOf("STUDIO")).toBe(1e12);
	});
});
