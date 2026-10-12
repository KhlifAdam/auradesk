import type { PageMeta } from "@/services/shared/pagination";
import type {
	InvoiceDisplayStatus,
	InvoiceStatus,
	PaymentMethod,
} from "./options";
import type { InvoiceTotals } from "./totals";

export interface InvoiceSummary {
	id: string;
	number: string;
	status: InvoiceStatus;
	displayStatus: InvoiceDisplayStatus;
	clientName: string;
	issueDate: string;
	dueDate: string | null;
	total: number;
	paid: number;
	balance: number;
}

export interface InvoiceItemDetail {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

export interface InvoicePaymentDetail {
	id: string;
	amount: number;
	paidAt: string;
	method: PaymentMethod;
	reference: string;
}

export interface InvoiceIssuer {
	name: string;
	email: string;
	phone: string;
	city: string;
	country: string;
}

export interface InvoiceDetail extends InvoiceSummary {
	projectId: string | null;
	projectTitle: string | null;
	clientId: string | null;
	clientEmail: string;
	clientPhone: string;
	clientAddress: string;
	taxRate: number;
	notes: string;
	sentAt: string | null;
	paidAt: string | null;
	totals: InvoiceTotals;
	items: InvoiceItemDetail[];
	payments: InvoicePaymentDetail[];
	issuer: InvoiceIssuer;
}

export interface InvoicePage extends PageMeta {
	items: InvoiceSummary[];
}

export interface InvoiceStats {
	/** Total of issued (sent or paid) invoices. */
	invoiced: number;
	/** Still to collect on sent invoices. */
	outstanding: number;
	overdueCount: number;
	/** Collected on all invoices. */
	collected: number;
}
