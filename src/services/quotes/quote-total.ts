import { computeTotals } from "@/services/invoices/totals";

type Amount = { toNumber(): number };

/** A stored quote's total: its lines, less the discount, plus tax. */
export function quoteTotalOf(row: {
	discount: Amount;
	taxRate: Amount;
	items: { quantity: Amount; unitPrice: Amount }[];
}) {
	return computeTotals(
		row.items.map((item) => ({
			quantity: item.quantity.toNumber(),
			unitPrice: item.unitPrice.toNumber(),
		})),
		row.discount.toNumber(),
		row.taxRate.toNumber(),
	).total;
}
