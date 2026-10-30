import { emptyInvoiceValues } from "@/services/invoices/form-values";
import { QUOTE_VALID_DAYS } from "./options";
import type { QuoteValues } from "./schemas";
import type { QuoteDetail } from "./types";

const day = (date: Date) => date.toISOString().slice(0, 10);

/** An invoice form's defaults, valid for `QUOTE_VALID_DAYS` instead of due. */
export function emptyQuoteValues(
	prefill: Partial<QuoteValues> = {},
): QuoteValues {
	const until = new Date();
	until.setUTCDate(until.getUTCDate() + QUOTE_VALID_DAYS);
	return {
		...emptyInvoiceValues(),
		bookingId: "",
		dueDate: day(until),
		...prefill,
	};
}

export function quoteToValues(quote: QuoteDetail): QuoteValues {
	return {
		bookingId: quote.bookingId ?? "",
		projectId: quote.projectId ?? "",
		clientId: quote.clientId ?? "",
		clientName: quote.clientName,
		clientEmail: quote.clientEmail,
		clientPhone: quote.clientPhone,
		clientAddress: quote.clientAddress,
		issueDate: quote.issueDate.slice(0, 10),
		dueDate: quote.validUntil?.slice(0, 10) ?? "",
		taxRate: quote.taxRate || null,
		discount: quote.totals.discount || null,
		notes: quote.notes,
		items: quote.items.map((item) => ({
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
		})),
	};
}
