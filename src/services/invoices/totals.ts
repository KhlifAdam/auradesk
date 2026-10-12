/** TND has three decimals (millimes); rounding keeps float noise out. */
export const roundMoney = (value: number) => Math.round(value * 1000) / 1000;

export interface InvoiceLine {
	quantity: number | null;
	unitPrice: number | null;
}

export interface InvoiceTotals {
	subtotal: number;
	discount: number;
	taxAmount: number;
	total: number;
}

/** Subtotal of the lines, minus the discount, plus tax on what remains. */
export function computeTotals(
	items: InvoiceLine[],
	discount: number | null,
	taxRate: number | null,
): InvoiceTotals {
	const subtotal = roundMoney(
		items.reduce(
			(sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
			0,
		),
	);
	const off = Math.min(discount ?? 0, subtotal);
	const taxable = subtotal - off;
	const taxAmount = roundMoney((taxable * (taxRate ?? 0)) / 100);
	return {
		subtotal,
		discount: roundMoney(off),
		taxAmount,
		total: roundMoney(taxable + taxAmount),
	};
}

export const lineTotal = (item: InvoiceLine) =>
	roundMoney((item.quantity ?? 0) * (item.unitPrice ?? 0));
