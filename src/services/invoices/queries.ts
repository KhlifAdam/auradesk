import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { displayStatus } from "./options";
import { INVOICE_PAGE_SIZE, type ListInvoicesParams } from "./schemas";
import { computeTotals, lineTotal, roundMoney } from "./totals";
import type { InvoiceDetail, InvoicePage, InvoiceSummary } from "./types";

const num = (value: { toNumber(): number }) => value.toNumber();

const summaryInclude = {
	items: { orderBy: [{ position: "asc" }, { id: "asc" }] },
	payments: { orderBy: [{ paidAt: "asc" }, { id: "asc" }] },
} satisfies Prisma.InvoiceInclude;

type SummaryRow = Prisma.InvoiceGetPayload<{ include: typeof summaryInclude }>;

function totalsOf(row: SummaryRow) {
	const items = row.items.map((item) => ({
		quantity: num(item.quantity),
		unitPrice: num(item.unitPrice),
	}));
	const totals = computeTotals(items, num(row.discount), num(row.taxRate));
	const paid = roundMoney(
		row.payments.reduce((sum, payment) => sum + num(payment.amount), 0),
	);
	return { totals, paid };
}

function toSummary(row: SummaryRow): InvoiceSummary {
	const { totals, paid } = totalsOf(row);
	const dueDate = row.dueDate?.toISOString() ?? null;
	return {
		id: row.id,
		number: row.number,
		status: row.status,
		displayStatus: displayStatus(row.status, dueDate),
		clientName: row.clientName,
		issueDate: row.issueDate.toISOString(),
		dueDate,
		total: totals.total,
		paid,
		balance:
			row.status === "CANCELLED"
				? 0
				: Math.max(0, roundMoney(totals.total - paid)),
	};
}

const today = () => new Date(new Date().toISOString().slice(0, 10));

function listWhere(
	photographerId: string,
	{ q, status }: ListInvoicesParams,
	clientId?: string,
): Prisma.InvoiceWhereInput {
	const where: Prisma.InvoiceWhereInput = { photographerId };
	if (clientId) where.clientId = clientId;
	if (status === "OVERDUE") {
		where.status = "SENT";
		where.dueDate = { lt: today() };
	} else if (status) where.status = status;
	if (q) {
		where.OR = [
			{ number: { contains: q, mode: "insensitive" } },
			{ clientName: { contains: q, mode: "insensitive" } },
			{ clientEmail: { contains: q, mode: "insensitive" } },
		];
	}
	return where;
}

/** `clientId` narrows the list to one client's invoices. */
export async function listInvoices(
	photographerId: string,
	params: ListInvoicesParams,
	clientId?: string,
): Promise<InvoicePage> {
	const where = listWhere(photographerId, params, clientId);
	const total = await db.invoice.count({ where });
	const meta = pageMeta(params.page, total, INVOICE_PAGE_SIZE);
	const rows = await db.invoice.findMany({
		where,
		include: summaryInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
		skip: pageSkip(meta.page, INVOICE_PAGE_SIZE),
		take: INVOICE_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toSummary) };
}

const detailInclude = {
	...summaryInclude,
	project: { select: { id: true, title: true } },
	photographer: {
		select: {
			name: true,
			email: true,
			studio: {
				select: {
					name: true,
					email: true,
					phone: true,
					city: true,
					country: true,
				},
			},
		},
	},
} satisfies Prisma.InvoiceInclude;

type DetailRow = Prisma.InvoiceGetPayload<{ include: typeof detailInclude }>;

function toDetail(row: DetailRow): InvoiceDetail {
	const { totals } = totalsOf(row);
	const studio = row.photographer.studio;
	return {
		...toSummary(row),
		projectId: row.project?.id ?? null,
		projectTitle: row.project?.title ?? null,
		clientId: row.clientId,
		clientEmail: row.clientEmail ?? "",
		clientPhone: row.clientPhone ?? "",
		clientAddress: row.clientAddress ?? "",
		taxRate: num(row.taxRate),
		notes: row.notes ?? "",
		sentAt: row.sentAt?.toISOString() ?? null,
		paidAt: row.paidAt?.toISOString() ?? null,
		totals,
		items: row.items.map((item) => {
			const line = {
				quantity: num(item.quantity),
				unitPrice: num(item.unitPrice),
			};
			return {
				id: item.id,
				description: item.description,
				...line,
				total: lineTotal(line),
			};
		}),
		payments: row.payments.map((payment) => ({
			id: payment.id,
			amount: num(payment.amount),
			paidAt: payment.paidAt.toISOString(),
			method: payment.method,
			reference: payment.reference ?? "",
		})),
		issuer: {
			name: studio?.name ?? row.photographer.name,
			email: studio?.email ?? row.photographer.email,
			phone: studio?.phone ?? "",
			city: studio?.city ?? "",
			country: studio?.country ?? "",
		},
	};
}

export async function getInvoice(
	photographerId: string,
	id: string,
): Promise<InvoiceDetail | null> {
	const row = await db.invoice.findFirst({
		where: { id, photographerId },
		include: detailInclude,
	});
	return row ? toDetail(row) : null;
}

/** An issued invoice addressed to the client's account (never a draft). */
export async function getClientInvoice(
	clientId: string,
	id: string,
): Promise<InvoiceDetail | null> {
	const row = await db.invoice.findFirst({
		where: { id, clientId, status: { in: ["SENT", "PAID"] } },
		include: detailInclude,
	});
	return row ? toDetail(row) : null;
}

/** Invoices of one project, newest first (a project rarely has many). */
export async function listProjectInvoices(
	photographerId: string,
	projectId: string,
): Promise<InvoiceSummary[]> {
	const rows = await db.invoice.findMany({
		where: { photographerId, projectId },
		include: summaryInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
	});
	return rows.map(toSummary);
}

/** The client's issued invoices for one project, for the portal. */
export async function listClientProjectInvoices(
	clientId: string,
	projectId: string,
): Promise<InvoiceSummary[]> {
	const rows = await db.invoice.findMany({
		where: { clientId, projectId, status: { in: ["SENT", "PAID"] } },
		include: summaryInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
	});
	return rows.map(toSummary);
}

/** The client's issued invoices across every studio, newest first. */
export async function listClientInvoices(
	clientId: string,
	take = 20,
): Promise<InvoiceSummary[]> {
	const rows = await db.invoice.findMany({
		where: { clientId, status: { in: ["SENT", "PAID"] } },
		include: summaryInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
		take,
	});
	return rows.map(toSummary);
}
