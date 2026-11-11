import "server-only";

import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import {
	type CollectItem,
	invoiceGross,
	invoiceReason,
	projectReason,
	projectRemainder,
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
	/**
	 * Everything still owed, each amount once: the unpaid part of sent
	 * invoices (project, standalone, photo book) plus the part of project
	 * prices not invoiced yet. Drafts and quotes aren't owed yet.
	 */
	toCollect: number;
	overdue: { count: number; amount: number };
	/** Project prices not invoiced yet (part of `toCollect`). */
	notInvoiced: number;
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
		// Its invoices are counted as invoices; the project only for the part of
		// its price they don't bill yet (see `projectRemainder`).
		db.project.findMany({
			where: {
				photographerId,
				price: { not: null },
				paymentStatus: { not: "PAID" },
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
				invoices: {
					where: { status: { in: ["SENT", "PAID"] } },
					select: {
						taxRate: true,
						items: { select: { quantity: true, unitPrice: true } },
					},
				},
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

	const t = await getTranslations("Money");
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
			// A photo book is billed on its own, apart from its project.
			label: row.book_id
				? t("rows.bookLabel", { title: row.book_title ?? "" })
				: [row.number, row.project_title].filter(Boolean).join(" · "),
			detail: row.book_id
				? t("rows.book", { number: row.number, client: row.client_name })
				: t("rows.invoice", { client: row.client_name }),
			clientName: row.client_name,
			amount,
			...invoiceReason(row.due_date, book, today),
			href: row.book_id
				? `/dashboard/books/${row.book_id}`
				: `/dashboard/invoices/${row.id}`,
		});
	}
	for (const project of projects) {
		const hasIssuedInvoices = project.invoices.length > 0;
		const amount = projectRemainder({
			price: project.price?.toNumber() ?? 0,
			advance: project.advance.toNumber(),
			invoicedGross: project.invoices.reduce(
				(sum, invoice) =>
					sum +
					invoiceGross(
						invoice.items.reduce(
							(lines, item) =>
								lines + item.quantity.toNumber() * item.unitPrice.toNumber(),
							0,
						),
						invoice.taxRate.toNumber(),
					),
				0,
			),
			hasIssuedInvoices,
		});
		if (amount <= 0) continue;
		const clientName = project.client?.name ?? project.contactName ?? "";
		items.push({
			kind: "project",
			id: project.id,
			label: project.title,
			detail: t(hasIssuedInvoices ? "rows.projectRest" : "rows.project", {
				client: clientName,
			}),
			clientName,
			amount,
			...projectReason(project.stage, project.eventDate, today),
			href: `/dashboard/projects/${project.id}`,
		});
	}

	const ranked = rankToCollect(items);
	const overdue = ranked.filter((i) => i.reason === "overdue");
	return {
		toCollect: roundMoney(ranked.reduce((sum, i) => sum + i.amount, 0)),
		notInvoiced: roundMoney(
			ranked
				.filter((i) => i.kind === "project")
				.reduce((sum, i) => sum + i.amount, 0),
		),
		overdue: {
			count: overdue.length,
			amount: roundMoney(overdue.reduce((sum, i) => sum + i.amount, 0)),
		},
		collectedThisMonth: roundMoney(collected._sum.amount?.toNumber() ?? 0),
		items: ranked.slice(0, limit),
		total: ranked.length,
	};
}
