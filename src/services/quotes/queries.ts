import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { computeTotals, lineTotal } from "@/services/invoices/totals";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { quoteDisplayStatus } from "./options";
import { type ListQuotesParams, QUOTE_PAGE_SIZE } from "./schemas";
import type { QuoteDetail, QuotePage, QuoteSummary } from "./types";

const num = (value: { toNumber(): number }) => value.toNumber();

const summaryInclude = {
	items: { orderBy: [{ position: "asc" }, { id: "asc" }] },
} satisfies Prisma.QuoteInclude;

type SummaryRow = Prisma.QuoteGetPayload<{ include: typeof summaryInclude }>;

const lines = (row: SummaryRow) =>
	row.items.map((item) => ({
		quantity: num(item.quantity),
		unitPrice: num(item.unitPrice),
	}));

const totalsOf = (row: SummaryRow) =>
	computeTotals(lines(row), num(row.discount), num(row.taxRate));

function toSummary(row: SummaryRow): QuoteSummary {
	return {
		id: row.id,
		number: row.number,
		status: row.status,
		displayStatus: quoteDisplayStatus(row.status, row.invoiceId),
		clientName: row.clientName,
		issueDate: row.issueDate.toISOString(),
		validUntil: row.validUntil?.toISOString() ?? null,
		total: totalsOf(row).total,
		invoiceId: row.invoiceId,
	};
}

function listWhere(
	photographerId: string,
	{ q, status }: ListQuotesParams,
): Prisma.QuoteWhereInput {
	const where: Prisma.QuoteWhereInput = { photographerId };
	if (status === "INVOICED") where.invoiceId = { not: null };
	else if (status) {
		where.status = status;
		where.invoiceId = null;
	}
	if (q) {
		where.OR = [
			{ number: { contains: q, mode: "insensitive" } },
			{ clientName: { contains: q, mode: "insensitive" } },
			{ clientEmail: { contains: q, mode: "insensitive" } },
		];
	}
	return where;
}

export async function listQuotes(
	photographerId: string,
	params: ListQuotesParams,
): Promise<QuotePage> {
	const where = listWhere(photographerId, params);
	const total = await db.quote.count({ where });
	const meta = pageMeta(params.page, total, QUOTE_PAGE_SIZE);
	const rows = await db.quote.findMany({
		where,
		include: summaryInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
		skip: pageSkip(meta.page, QUOTE_PAGE_SIZE),
		take: QUOTE_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toSummary) };
}

const detailInclude = {
	...summaryInclude,
	booking: { select: { id: true, title: true } },
	project: { select: { id: true, title: true } },
	invoice: { select: { number: true } },
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
} satisfies Prisma.QuoteInclude;

type DetailRow = Prisma.QuoteGetPayload<{ include: typeof detailInclude }>;

function toDetail(row: DetailRow): QuoteDetail {
	const studio = row.photographer.studio;
	return {
		...toSummary(row),
		bookingId: row.booking?.id ?? null,
		bookingTitle: row.booking?.title ?? null,
		projectId: row.project?.id ?? null,
		projectTitle: row.project?.title ?? null,
		clientId: row.clientId,
		clientEmail: row.clientEmail ?? "",
		clientPhone: row.clientPhone ?? "",
		clientAddress: row.clientAddress ?? "",
		taxRate: num(row.taxRate),
		notes: row.notes ?? "",
		sentAt: row.sentAt?.toISOString() ?? null,
		respondedAt: row.respondedAt?.toISOString() ?? null,
		invoiceNumber: row.invoice?.number ?? null,
		totals: totalsOf(row),
		items: row.items.map((item, index) => {
			const line = lines(row)[index];
			return {
				id: item.id,
				description: item.description,
				...line,
				total: lineTotal(line),
			};
		}),
		issuer: {
			name: studio?.name ?? row.photographer.name,
			email: studio?.email ?? row.photographer.email,
			phone: studio?.phone ?? "",
			city: studio?.city ?? "",
			country: studio?.country ?? "",
		},
	};
}

export async function getQuote(
	photographerId: string,
	id: string,
): Promise<QuoteDetail | null> {
	const row = await db.quote.findFirst({
		where: { id, photographerId },
		include: detailInclude,
	});
	return row ? toDetail(row) : null;
}

/** A quote sent to the client's account (never a draft). */
export async function getClientQuote(
	clientId: string,
	id: string,
): Promise<QuoteDetail | null> {
	const row = await db.quote.findFirst({
		where: { id, clientId, status: { not: "DRAFT" } },
		include: detailInclude,
	});
	return row ? toDetail(row) : null;
}

/** The client's quotes from every studio: those awaiting an answer first. */
export async function listClientQuotes(
	clientId: string,
	take = 20,
): Promise<QuoteSummary[]> {
	const rows = await db.quote.findMany({
		where: { clientId, status: { not: "DRAFT" } },
		include: {
			...summaryInclude,
			photographer: {
				select: { name: true, studio: { select: { name: true } } },
			},
		},
		orderBy: [{ status: "asc" }, { issueDate: "desc" }, { number: "desc" }],
		take,
	});
	return rows.map((row) => ({
		...toSummary(row),
		label: row.photographer.studio?.name ?? row.photographer.name,
	}));
}

/** Quotes made for one booking, newest first. */
export async function listBookingQuotes(
	photographerId: string,
	bookingId: string,
): Promise<QuoteSummary[]> {
	const rows = await db.quote.findMany({
		where: { photographerId, bookingId },
		include: summaryInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
	});
	return rows.map(toSummary);
}
