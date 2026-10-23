import { describe, expect, it } from "vitest";
import { computeTotals, lineTotal } from "@/services/invoices/totals";

describe("computeTotals", () => {
	it("adds the lines", () => {
		const totals = computeTotals(
			[
				{ quantity: 2, unitPrice: 150 },
				{ quantity: 1, unitPrice: 100 },
			],
			null,
			null,
		);
		expect(totals).toEqual({ subtotal: 400, discount: 0, taxAmount: 0, total: 400 });
	});
	it("takes the discount before tax", () => {
		const totals = computeTotals([{ quantity: 1, unitPrice: 1000 }], 100, 19);
		expect(totals.taxAmount).toBe(171);
		expect(totals.total).toBe(1071);
	});
	it("never discounts more than the subtotal", () => {
		const totals = computeTotals([{ quantity: 1, unitPrice: 50 }], 80, 0);
		expect(totals.discount).toBe(50);
		expect(totals.total).toBe(0);
	});
	it("treats empty fields as zero", () => {
		expect(computeTotals([{ quantity: null, unitPrice: 30 }], null, null).total).toBe(0);
	});
	it("rounds to millimes", () => {
		expect(lineTotal({ quantity: 3, unitPrice: 0.1 })).toBe(0.3);
	});
});
