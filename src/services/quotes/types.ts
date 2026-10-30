import type { InvoiceTotals } from "@/services/invoices/totals";
import type {
	InvoiceIssuer,
	InvoiceItemDetail,
} from "@/services/invoices/types";
import type { PageMeta } from "@/services/shared/pagination";
import type { QuoteDisplayStatus, QuoteStatus } from "./options";

export interface QuoteSummary {
	id: string;
	number: string;
	status: QuoteStatus;
	displayStatus: QuoteDisplayStatus;
	clientName: string;
	/** Portal only: the studio, shown instead of the client. */
	label?: string;
	issueDate: string;
	validUntil: string | null;
	total: number;
	invoiceId: string | null;
}

export interface QuoteDetail extends QuoteSummary {
	bookingId: string | null;
	bookingTitle: string | null;
	projectId: string | null;
	projectTitle: string | null;
	clientId: string | null;
	clientEmail: string;
	clientPhone: string;
	clientAddress: string;
	taxRate: number;
	notes: string;
	sentAt: string | null;
	respondedAt: string | null;
	invoiceNumber: string | null;
	totals: InvoiceTotals;
	items: InvoiceItemDetail[];
	issuer: InvoiceIssuer;
}

export interface QuotePage extends PageMeta {
	items: QuoteSummary[];
}
