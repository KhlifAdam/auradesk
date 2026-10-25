import "server-only";

import { db } from "@/lib/db";
import {
	type CollectItem,
	invoiceReason,
	projectReason,
	rankToCollect,
} from "@/lib/money/collect";
import { computeTotals, roundMoney } from "@/services/invoices/totals";

interface InvoiceRow {
	id: string;
	number: string;
	client_name: string;
	due_date: Date | null;
	discount: string;
	tax_rate: string;
	subtotal: string;
	paid: string;
	book_id: string | null;
	book_status: string | null;
	book_title: string | null;
	project_title: string | null;
}

export interface MoneyOverview {
	/** Everything still owed: unpaid invoices plus unbilled project balances. */
	toCollect: number;
	overdue: { count: number; amount: number };
	collectedThisMonth: number;
	/** What to chase, most pressing first. */
	items: CollectItem[];
	total: number;
}

/** What the studio is owed and what to chase first, from invoices and projects. */
export async function getMoneyOverview(
	photographerId: string,
	limit = 6,
): Promise<MoneyOverview> {
	const today = new Date();
	const monthStart = new Date(
		Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
	);
	const [invoices, projects, collected] = await Promise.all([
		db.$queryRaw<InvoiceRow[]>`
			SELECT i.id, i.number, i.client_name, i.due_date,
				i.discount::text, i.tax_rate::text,
				COALESCE((SELECT SUM(it.quantity * it.unit_price) FROM invoice_items it
					WHERE it.invoice_id = i.id), 0)::text AS subtotal,
				COALESCE((SELECT SUM(p.amount) FROM invoice_payments p
					WHERE p.invoice_id = i.id), 0)::text AS paid,
				b.id AS book_id, b.status::text AS book_status, b.title AS book_title,
				pr.title AS project_title
			FROM invoices i
			LEFT JOIN photo_books b ON b.invoice_id = i.id
			LEFT JOIN projects pr ON pr.id = i.project_id
			WHERE i.photographer_id = ${photographerId} AND i.status = 'SENT'`,
		// A project billed through an invoice is counted there, not twice.
		db.project.findMany({
			where: {
				photographerId,
				price: { not: null },
				paymentStatus: { not: "PAID" },
				invoices: { none: { status: { in: ["SENT", "PAID"] } } },
			},
			select: {
				id: true,
				title: true,
				price: true,
				advance: true,
				stage: true,
				eventDate: true,
				contactName: true,
				client: { select: { name: true } },
			},
		}),
		db.invoicePayment.aggregate({
			where: {
				invoice: { photographerId },
				paidAt: { gte: monthStart },
			},
			_sum: { amount: true },
		}),
	]);

	const items: CollectItem[] = [];
	for (const row of invoices) {
		const { total } = computeTotals(
			[{ quantity: 1, unitPrice: Number(row.subtotal) }],
			Number(row.discount),
			Number(row.tax_rate),
		);
		const amount = roundMoney(total - Number(row.paid));
		if (amount <= 0) continue;
		const book = row.book_status ? { status: row.book_status } : null;
		items.push({
			kind: row.book_id ? "book" : "invoice",
			id: row.id,
			label: [row.number, row.book_title ?? row.project_title]
				.filter(Boolean)
				.join(" · "),
			clientName: row.client_name,
			amount,
			...invoiceReason(row.due_date, book, today),
			href: row.book_id
				? `/dashboard/books/${row.book_id}`
				: `/dashboard/invoices/${row.id}`,
		});
	}
	for (const project of projects) {
		const amount = roundMoney(
			(project.price?.toNumber() ?? 0) - project.advance.toNumber(),
		);
		if (amount <= 0) continue;
		items.push({
			kind: "project",
			id: project.id,
			label: project.title,
			clientName: project.client?.name ?? project.contactName ?? "",
			amount,
			...projectReason(project.stage, project.eventDate, today),
			href: `/dashboard/projects/${project.id}`,
		});
	}

	const ranked = rankToCollect(items);
	const overdue = ranked.filter((i) => i.reason === "overdue");
	return {
		toCollect: roundMoney(ranked.reduce((sum, i) => sum + i.amount, 0)),
		overdue: {
			count: overdue.length,
			amount: roundMoney(overdue.reduce((sum, i) => sum + i.amount, 0)),
		},
		collectedThisMonth: roundMoney(collected._sum.amount?.toNumber() ?? 0),
		items: ranked.slice(0, limit),
		total: ranked.length,
	};
}
