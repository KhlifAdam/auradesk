import "server-only";

import { db } from "@/lib/db";
import { displayStatus } from "./options";
import { computeTotals, roundMoney } from "./totals";
import type { InvoiceStats } from "./types";

interface StatsRow {
	status: string;
	due_date: Date | null;
	discount: string;
	tax_rate: string;
	subtotal: string;
	paid: string;
}

/** Money at a glance, over issued invoices (drafts and cancelled excluded). */
export async function getInvoiceStats(
	photographerId: string,
): Promise<InvoiceStats> {
	const rows = await db.$queryRaw<StatsRow[]>`
		SELECT i.status, i.due_date, i.discount::text, i.tax_rate::text,
			COALESCE((SELECT SUM(it.quantity * it.unit_price) FROM invoice_items it
				WHERE it.invoice_id = i.id), 0)::text AS subtotal,
			COALESCE((SELECT SUM(p.amount) FROM invoice_payments p
				WHERE p.invoice_id = i.id), 0)::text AS paid
		FROM invoices i
		WHERE i.photographer_id = ${photographerId}
			AND i.status IN ('SENT', 'PAID')`;

	const stats: InvoiceStats = {
		invoiced: 0,
		outstanding: 0,
		overdueCount: 0,
		collected: 0,
	};
	for (const row of rows) {
		const subtotal = Number(row.subtotal);
		const { total } = computeTotals(
			[{ quantity: 1, unitPrice: subtotal }],
			Number(row.discount),
			Number(row.tax_rate),
		);
		const paid = Number(row.paid);
		stats.invoiced += total;
		stats.collected += paid;
		if (row.status === "SENT") {
			stats.outstanding += Math.max(0, total - paid);
			const due = row.due_date?.toISOString() ?? null;
			if (displayStatus("SENT", due) === "OVERDUE") stats.overdueCount++;
		}
	}
	return {
		...stats,
		invoiced: roundMoney(stats.invoiced),
		outstanding: roundMoney(stats.outstanding),
		collected: roundMoney(stats.collected),
	};
}
