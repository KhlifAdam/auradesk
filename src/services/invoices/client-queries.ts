import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { summaryInclude, toSummary } from "./queries";
import { INVOICE_PAGE_SIZE, type ListClientInvoicesParams } from "./schemas";
import { roundMoney } from "./totals";
import type { InvoicePage } from "./types";

const clientInclude = {
	...summaryInclude,
	project: { select: { title: true } },
	photographer: { select: { name: true, studio: { select: { name: true } } } },
} satisfies Prisma.InvoiceInclude;

type ClientRow = Prisma.InvoiceGetPayload<{ include: typeof clientInclude }>;

const today = () => new Date(new Date().toISOString().slice(0, 10));

/** Only issued invoices addressed to the client's account, never drafts. */
function clientWhere(
	clientId: string,
	status?: ListClientInvoicesParams["status"],
): Prisma.InvoiceWhereInput {
	if (status === "OVERDUE")
		return { clientId, status: "SENT", dueDate: { lt: today() } };
	return { clientId, status: status ?? { in: ["SENT", "PAID"] } };
}

function toClientSummary(row: ClientRow) {
	const studio = row.photographer.studio?.name ?? row.photographer.name;
	return {
		...toSummary(row),
		label: row.project ? `${studio} · ${row.project.title}` : studio,
	};
}

/** One page of the client's invoices across every studio, newest first. */
export async function listClientInvoicePage(
	clientId: string,
	{ page, status }: ListClientInvoicesParams,
): Promise<InvoicePage> {
	const where = clientWhere(clientId, status);
	const total = await db.invoice.count({ where });
	const meta = pageMeta(page, total, INVOICE_PAGE_SIZE);
	const rows = await db.invoice.findMany({
		where,
		include: clientInclude,
		orderBy: [{ issueDate: "desc" }, { number: "desc" }],
		skip: pageSkip(meta.page, INVOICE_PAGE_SIZE),
		take: INVOICE_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toClientSummary) };
}

/** What the client still owes across all unpaid invoices, and how many are late. */
export async function getClientInvoiceDue(clientId: string) {
	const rows = await db.invoice.findMany({
		where: { clientId, status: "SENT" },
		include: summaryInclude,
	});
	const unpaid = rows.map(toSummary).filter((i) => i.balance > 0);
	return {
		due: roundMoney(unpaid.reduce((sum, i) => sum + i.balance, 0)),
		unpaidCount: unpaid.length,
		overdueCount: unpaid.filter((i) => i.displayStatus === "OVERDUE").length,
	};
}
