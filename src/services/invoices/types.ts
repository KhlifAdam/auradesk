import type { ChangeMark } from "@/components/shared/change-mark";
import type { PageMeta } from "@/services/shared/pagination";
import type {
	InvoiceDisplayStatus,
	InvoiceStatus,
	PaymentMethod,
} from "./options";
import type { InvoiceTotals } from "./totals";

/** What an invoice bills: a project, a photo book order, or free lines. */
export type InvoiceKind = "project" | "book" | "custom";

export interface InvoiceSummary {
	id: string;
	number: string;
	status: InvoiceStatus;
	displayStatus: InvoiceDisplayStatus;
	clientName: string;
	/** What it bills, shown as the row title: the project, book or first line. */
	subject: string | null;
	kind: InvoiceKind;
	/** Portal only: the studio, shown instead of the client. */
	label?: string;
	issueDate: string;
	dueDate: string | null;
	total: number;
	paid: number;
	balance: number;
	/** Portal only: not opened by the client yet. */
	mark?: ChangeMark;
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
