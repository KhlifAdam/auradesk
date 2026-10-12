// Mirrors the Prisma enums.

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "CANCELLED"] as const;

export const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CARD",
	"CHEQUE",
	"OTHER",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** What the list shows: the stored status, or OVERDUE for a late sent invoice. */
export type InvoiceDisplayStatus = InvoiceStatus | "OVERDUE";

/** Filters of the list; OVERDUE is a sent invoice past its due date. */
export const INVOICE_FILTERS = [...INVOICE_STATUSES, "OVERDUE"] as const;

/** Sent and past its due date (compared by day, in UTC like other dates). */
export function isOverdue(
	status: InvoiceStatus,
	dueDate: string | null,
	now = new Date(),
) {
	if (status !== "SENT" || !dueDate) return false;
	return dueDate.slice(0, 10) < now.toISOString().slice(0, 10);
}

export function displayStatus(
	status: InvoiceStatus,
	dueDate: string | null,
): InvoiceDisplayStatus {
	return isOverdue(status, dueDate) ? "OVERDUE" : status;
}

/** Lines of an invoice; more belong in separate invoices. */
export const MAX_INVOICE_ITEMS = 50;
