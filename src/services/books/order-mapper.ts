import "server-only";

import { bookOrderOptionsSchema, quoteSchema } from "@/lib/books/pricing";
import type { BookInvoice, BookOrder, BookStatus } from "./types";

interface OrderRow {
	status: BookStatus;
	copies: number;
	options: unknown;
	clientNote: string;
	quote: unknown;
	total: { toNumber(): number } | null;
	statusNote: string;
	submittedAt: Date | null;
}

/** The order side of a stored book, with its stored JSON checked on the way out. */
export function toBookOrder(
	row: OrderRow,
	invoice: BookInvoice | null,
): BookOrder {
	const options = bookOrderOptionsSchema.safeParse(row.options);
	const quote = quoteSchema.safeParse(row.quote);
	return {
		status: row.status,
		copies: row.copies,
		options: options.success ? options.data : null,
		clientNote: row.clientNote,
		quote: quote.success ? quote.data : null,
		total: row.total?.toNumber() ?? null,
		statusNote: row.statusNote,
		submittedAt: row.submittedAt?.toISOString() ?? null,
		invoice,
	};
}

/** The part of an invoice an order shows (its total and what is paid). */
export const toBookInvoice = (invoice: {
	id: string;
	number: string;
	status: BookInvoice["status"];
	total: number;
	paid: number;
}): BookInvoice => ({
	id: invoice.id,
	number: invoice.number,
	status: invoice.status,
	total: invoice.total,
	paid: invoice.paid,
});
