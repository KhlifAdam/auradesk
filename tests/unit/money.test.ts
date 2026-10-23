import { describe, expect, it } from "vitest";
import {
	amountRemaining,
	suggestPaymentStatus,
} from "@/services/projects/money";

describe("amountRemaining", () => {
	it("is null while no price is set", () => {
		expect(amountRemaining(null, 50)).toBeNull();
	});
	it("subtracts what was paid", () => {
		expect(amountRemaining(450, 150)).toBe(300);
	});
	it("never goes below zero when overpaid", () => {
		expect(amountRemaining(200, 250)).toBe(0);
	});
	it("keeps millimes exact (no float noise)", () => {
		expect(amountRemaining(100.1, 0.2)).toBe(99.9);
	});
});

describe("suggestPaymentStatus", () => {
	it("is null without a positive price", () => {
		expect(suggestPaymentStatus(null, 0)).toBeNull();
		expect(suggestPaymentStatus(0, 0)).toBeNull();
	});
	it("follows the amounts", () => {
		expect(suggestPaymentStatus(200, 0)).toBe("UNPAID");
		expect(suggestPaymentStatus(200, 50)).toBe("PARTIAL");
		expect(suggestPaymentStatus(200, 200)).toBe("PAID");
		expect(suggestPaymentStatus(200, 300)).toBe("PAID");
	});
});
