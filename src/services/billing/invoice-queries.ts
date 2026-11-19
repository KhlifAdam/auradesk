import "server-only";

import { db } from "@/lib/db";
import { fromMillimes } from "@/lib/payments/types";
import { pageMeta, pageSkip } from "@/services/shared/pagination";

export const BILLING_INVOICES_PAGE_SIZE = 10;

/**
 * A photographer's AuraDesk invoices, newest first. Payment attempts that
 * were never paid are not invoices, so they never show here.
 */
export async function listBillingInvoices(
	photographerId: string,
	page: number,
) {
	const where = { photographerId, status: { not: "CANCELLED" as const } };
	const meta = pageMeta(
		page,
		await db.billingInvoice.count({ where }),
		BILLING_INVOICES_PAGE_SIZE,
	);
	const rows = await db.billingInvoice.findMany({
		where,
		orderBy: [{ createdAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, BILLING_INVOICES_PAGE_SIZE),
		take: BILLING_INVOICES_PAGE_SIZE,
	});
	return {
		...meta,
		items: rows.map((row) => ({
			id: row.id,
			number: row.number,
			status: row.status,
			plan: row.plan,
			cycle: row.cycle,
			kind: row.kind,
			amount: fromMillimes(row.amountMillimes),
			periodStart: row.periodStart,
			periodEnd: row.periodEnd,
			paidAt: row.paidAt,
			createdAt: row.createdAt,
			gateway: row.gateway,
		})),
	};
}

export type BillingInvoicePage = Awaited<
	ReturnType<typeof listBillingInvoices>
>;
