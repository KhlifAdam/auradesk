// Mirrors the Prisma enum.

export const QUOTE_STATUSES = [
	"DRAFT",
	"SENT",
	"ACCEPTED",
	"DECLINED",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** What the list shows: the stored status, or INVOICED once turned into an invoice. */
export type QuoteDisplayStatus = QuoteStatus | "INVOICED";

export const QUOTE_FILTERS = [...QUOTE_STATUSES, "INVOICED"] as const;

export const quoteDisplayStatus = (
	status: QuoteStatus,
	invoiceId: string | null,
): QuoteDisplayStatus => (invoiceId ? "INVOICED" : status);

/** Sent or accepted quotes can become an invoice, once. */
export const canInvoiceQuote = (
	status: QuoteStatus,
	invoiceId: string | null,
) => !invoiceId && (status === "SENT" || status === "ACCEPTED");

/** Days a new quote stays valid. */
export const QUOTE_VALID_DAYS = 30;
