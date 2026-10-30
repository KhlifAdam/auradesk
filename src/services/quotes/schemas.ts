import { z } from "zod";
import { searchQuerySchema } from "@/services/clients/schemas";
import { checkDates, invoiceFields } from "@/services/invoices/schemas";
import { idSchema } from "@/services/shared/schemas";
import { QUOTE_FILTERS } from "./options";

export const QUOTE_PAGE_SIZE = 20;

// Same fields as an invoice; `dueDate` is the date the quote is valid until.
const quoteFields = invoiceFields.extend({ bookingId: z.string() });

export const quoteSchema = quoteFields.superRefine(checkDates);

export const updateQuoteSchema = quoteFields
	.extend({ id: idSchema })
	.superRefine(checkDates);

export const respondQuoteSchema = z.object({
	id: idSchema,
	accept: z.boolean(),
});

export const listQuotesSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	status: z.enum(QUOTE_FILTERS).optional().catch(undefined),
});

export type QuoteValues = z.infer<typeof quoteSchema>;
export type ListQuotesParams = z.infer<typeof listQuotesSchema>;
