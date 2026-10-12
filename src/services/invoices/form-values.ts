import type { InvoiceValues } from "./schemas";
import type { InvoiceDetail } from "./types";

const DUE_IN_DAYS = 15;

const day = (date: Date) => date.toISOString().slice(0, 10);

export function emptyInvoiceValues(
	prefill: Partial<InvoiceValues> = {},
): InvoiceValues {
	const today = new Date();
	const due = new Date(today);
	due.setUTCDate(due.getUTCDate() + DUE_IN_DAYS);
	return {
		projectId: "",
		clientId: "",
		clientName: "",
		clientEmail: "",
		clientPhone: "",
		clientAddress: "",
		issueDate: day(today),
		dueDate: day(due),
		taxRate: null,
		discount: null,
		notes: "",
		items: [{ description: "", quantity: 1, unitPrice: null }],
		...prefill,
	};
}

export function invoiceToValues(invoice: InvoiceDetail): InvoiceValues {
	return {
		projectId: invoice.projectId ?? "",
		clientId: invoice.clientId ?? "",
		clientName: invoice.clientName,
		clientEmail: invoice.clientEmail,
		clientPhone: invoice.clientPhone,
		clientAddress: invoice.clientAddress,
		issueDate: invoice.issueDate.slice(0, 10),
		dueDate: invoice.dueDate?.slice(0, 10) ?? "",
		taxRate: invoice.taxRate || null,
		discount: invoice.totals.discount || null,
		notes: invoice.notes,
		items: invoice.items.map((item) => ({
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
		})),
	};
}
