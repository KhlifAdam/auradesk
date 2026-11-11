/**
 * What a studio is still owed, and in which order to chase it. Pure, so the
 * overview, the assistant and the tests share the same rules.
 */

export type CollectKind = "invoice" | "book" | "project";

/** Why an amount is worth chasing now, most pressing first. */
export const COLLECT_REASONS = [
	"overdue",
	"deliveredUnpaid",
	"readyUnpaid",
	"deliveringSoon",
	"dueSoon",
	"open",
] as const;
export type CollectReason = (typeof COLLECT_REASONS)[number];

export interface CollectItem {
	kind: CollectKind;
	id: string;
	/** What it is: the invoice and its project, the photo book, the project. */
	label: string;
	/** Second line: what kind of amount it is, and who owes it. */
	detail: string;
	clientName: string;
	amount: number;
	reason: CollectReason;
	/** Days late (overdue) or days left (due soon), when it means something. */
	days: number | null;
	href: string;
}

const DAY_MS = 86_400_000;
const SOON_DAYS = 7;

export const daysBetween = (from: Date, to: Date) =>
	Math.round(
		(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
			Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) /
			DAY_MS,
	);

/** An issued invoice that isn't fully paid. */
export function invoiceReason(
	dueDate: Date | null,
	book: { status: string } | null,
	today: Date,
): { reason: CollectReason; days: number | null } {
	if (dueDate) {
		const left = daysBetween(today, dueDate);
		if (left < 0) return { reason: "overdue", days: -left };
		if (book?.status === "DELIVERED")
			return { reason: "deliveredUnpaid", days: null };
		if (book?.status === "READY") return { reason: "readyUnpaid", days: null };
		if (left <= SOON_DAYS) return { reason: "dueSoon", days: left };
		return { reason: "open", days: left };
	}
	if (book?.status === "DELIVERED")
		return { reason: "deliveredUnpaid", days: null };
	if (book?.status === "READY") return { reason: "readyUnpaid", days: null };
	return { reason: "open", days: null };
}

/** A project with a price and a balance, not billed through an invoice yet. */
export function projectReason(
	stage: string,
	eventDate: Date | null,
	today: Date,
): { reason: CollectReason; days: number | null } {
	if (stage === "DELIVERY" || stage === "COMPLETED")
		return { reason: "deliveredUnpaid", days: null };
	if (stage === "EXPORT") return { reason: "deliveringSoon", days: null };
	if (eventDate) {
		const left = daysBetween(today, eventDate);
		if (left >= 0 && left <= SOON_DAYS)
			return { reason: "dueSoon", days: left };
	}
	return { reason: "open", days: null };
}

const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * What a project still owes outside its invoices, so every amount is counted
 * once. Without an issued invoice: its price minus the advance noted on it.
 * Once invoiced (the advance then lives on the invoice as a payment): the
 * part of its price not billed yet. A project's price is what the client
 * pays, tax included, so it is compared with what its invoices bill with tax
 * and before discount: a discount lowers that invoice's balance, not the
 * price left to bill.
 */
export function projectRemainder(project: {
	price: number;
	advance: number;
	/** What its sent and paid invoices bill, tax included, before discount. */
	invoicedGross: number;
	hasIssuedInvoices: boolean;
}) {
	const left = project.hasIssuedInvoices
		? project.price - project.invoicedGross
		: project.price - project.advance;
	return Math.max(0, round(left));
}

/** What an invoice bills, tax included, before its discount. */
export const invoiceGross = (subtotal: number, taxRate: number) =>
	round(subtotal * (1 + taxRate / 100));

/** Most pressing first; within a reason, the biggest amount first. */
export function rankToCollect(items: CollectItem[]) {
	return [...items].sort(
		(a, b) =>
			COLLECT_REASONS.indexOf(a.reason) - COLLECT_REASONS.indexOf(b.reason) ||
			(a.reason === "overdue" ? (b.days ?? 0) - (a.days ?? 0) : 0) ||
			b.amount - a.amount,
	);
}
