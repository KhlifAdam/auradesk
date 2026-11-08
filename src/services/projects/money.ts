import { CURRENCY, type PaymentStatus } from "./options";

/** TND has three decimals (millimes); rounding keeps float noise out. */
const round = (value: number) => Math.round(value * 1000) / 1000;

/** The price once invoice discounts are taken off; null while no price is set. */
export function netPrice(price: number | null, discount = 0) {
	return price === null ? null : Math.max(0, round(price - discount));
}

/** What is still owed; null while no price is set. */
export function amountRemaining(
	price: number | null,
	advance: number | null,
	discount = 0,
) {
	const net = netPrice(price, discount);
	return net === null ? null : Math.max(0, round(net - (advance ?? 0)));
}

/** The status the amounts imply; null while no price is set. */
export function suggestPaymentStatus(
	price: number | null,
	advance: number | null,
	discount = 0,
): PaymentStatus | null {
	if (price === null || price <= 0) return null;
	const net = netPrice(price, discount) ?? 0;
	const paid = advance ?? 0;
	if (paid >= net) return "PAID";
	return paid > 0 ? "PARTIAL" : "UNPAID";
}

export function formatMoney(value: number, locale: string) {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: CURRENCY,
		minimumFractionDigits: 0,
		maximumFractionDigits: 3,
	}).format(value);
}
