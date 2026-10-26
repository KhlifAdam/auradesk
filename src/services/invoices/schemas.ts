import { z } from "zod";
import { searchQuerySchema } from "@/services/clients/schemas";
import {
	dateInput,
	idSchema,
	moneyAmount,
	optionalEmail,
	optionalText,
	requiredText,
} from "@/services/shared/schemas";
import {
	CLIENT_INVOICE_FILTERS,
	INVOICE_FILTERS,
	MAX_INVOICE_ITEMS,
	PAYMENT_METHODS,
} from "./options";

export const INVOICE_PAGE_SIZE = 20;

const itemSchema = z.object({
	description: requiredText(300),
	quantity: z
		.number("invalidNumber")
		.positive("invalidNumber")
		.max(100_000, "invalidNumber")
		.nullable()
		.refine((v) => Number.isFinite(v ?? Number.NaN), "required"),
	unitPrice: moneyAmount.refine(
		(v) => Number.isFinite(v ?? Number.NaN),
		"required",
	),
});

const invoiceFields = z.object({
	projectId: z.string(),
	clientId: z.string(),
	clientName: requiredText(120),
	clientEmail: optionalEmail,
	clientPhone: optionalText(40),
	clientAddress: optionalText(300),
	issueDate: dateInput.refine((v) => v !== "", "required"),
	dueDate: dateInput,
	taxRate: z
		.number("invalidNumber")
		.min(0, "invalidNumber")
		.max(100, "invalidNumber")
		.nullable(),
	discount: moneyAmount,
	notes: optionalText(2000),
	items: z.array(itemSchema).min(1, "required").max(MAX_INVOICE_ITEMS),
});

function checkDates(v: z.infer<typeof invoiceFields>, ctx: z.RefinementCtx) {
	if (v.dueDate && v.issueDate && v.dueDate < v.issueDate)
		ctx.addIssue({
			code: "custom",
			path: ["dueDate"],
			message: "endBeforeStart",
		});
}

export const invoiceSchema = invoiceFields.superRefine(checkDates);

export const updateInvoiceSchema = invoiceFields
	.extend({ id: idSchema })
	.superRefine(checkDates);

export const paymentSchema = z.object({
	invoiceId: idSchema,
	amount: moneyAmount.refine((v) => (v ?? 0) > 0, "invalidAmount"),
	paidAt: dateInput.refine((v) => v !== "", "required"),
	method: z.enum(PAYMENT_METHODS),
	reference: optionalText(120),
});

export const deletePaymentSchema = z.object({
	invoiceId: idSchema,
	paymentId: idSchema,
});

export const listInvoicesSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	q: searchQuerySchema,
	status: z.enum(INVOICE_FILTERS).optional().catch(undefined),
});

/** `/portal/invoices`: the client's page and status filter. */
export const listClientInvoicesSchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	status: z.enum(CLIENT_INVOICE_FILTERS).optional().catch(undefined),
});

export type InvoiceValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemValues = z.infer<typeof itemSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;
export type ListInvoicesParams = z.infer<typeof listInvoicesSchema>;
export type ListClientInvoicesParams = z.infer<typeof listClientInvoicesSchema>;
