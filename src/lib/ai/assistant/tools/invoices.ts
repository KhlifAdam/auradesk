import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { INVOICE_FILTERS } from "@/services/invoices/options";
import { getInvoice, listInvoices } from "@/services/invoices/queries";
import { getInvoiceStats } from "@/services/invoices/stats";
import { toInvoiceRow, toRowPage } from "./rows";

/** Invoices: lists by status (OVERDUE included), one in detail, totals. */
export function invoiceTools(photographerId: string) {
	return {
		list_invoices: tool({
			description:
				"List invoices, newest first, with totals collected/outstanding. Status: DRAFT, SENT, PAID, CANCELLED or OVERDUE (sent and past due). 20 per page.",
			inputSchema: z.object({
				status: z.enum(INVOICE_FILTERS).optional(),
				q: z.string().max(100).optional().describe("Number or client name"),
				page: z.number().int().min(1).optional(),
			}),
			execute: async ({ status, q, page }) => {
				const [list, stats] = await Promise.all([
					listInvoices(photographerId, {
						page: page ?? 1,
						q: q?.trim() ?? "",
						status,
					}),
					getInvoiceStats(photographerId),
				]);
				return { ...toRowPage(list, toInvoiceRow), stats };
			},
		}),

		get_invoice: tool({
			description:
				"One invoice in detail: lines, payments, what is still owed, its project.",
			inputSchema: z.object({ invoiceId: z.string() }),
			execute: async ({ invoiceId }) => {
				const invoice = await getInvoice(photographerId, invoiceId);
				if (!invoice) return { found: false as const };
				return {
					found: true as const,
					invoice: {
						...toInvoiceRow(invoice),
						paid: invoice.paid,
						issueDate: invoice.issueDate,
						clientId: invoice.clientId,
						project: invoice.projectId
							? { id: invoice.projectId, title: invoice.projectTitle }
							: null,
						items: invoice.items.map((item) => ({
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							total: item.total,
						})),
						payments: invoice.payments.map((p) => ({
							amount: p.amount,
							paidAt: p.paidAt,
							method: p.method,
						})),
					},
				};
			},
		}),
	};
}
