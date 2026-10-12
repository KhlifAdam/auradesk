import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { suggestPaymentStatus } from "@/services/projects/money";
import { computeTotals, roundMoney } from "./totals";

type Tx = Prisma.TransactionClient;

const num = (value: { toNumber(): number }) => value.toNumber();

/** Next number for the year: INV-2026-0001, INV-2026-0002… Lock the photographer first. */
export async function nextInvoiceNumber(
	tx: Tx,
	photographerId: string,
	year: number,
) {
	const prefix = `INV-${year}-`;
	const last = await tx.invoice.findFirst({
		where: { photographerId, number: { startsWith: prefix } },
		orderBy: { number: "desc" },
		select: { number: true },
	});
	const next = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
	return `${prefix}${String(next).padStart(4, "0")}`;
}

/** Total and amount paid of one invoice. */
export async function invoiceBalance(tx: Tx, invoiceId: string) {
	const invoice = await tx.invoice.findUniqueOrThrow({
		where: { id: invoiceId },
		select: {
			status: true,
			discount: true,
			taxRate: true,
			items: { select: { quantity: true, unitPrice: true } },
			payments: { select: { amount: true } },
		},
	});
	const { total } = computeTotals(
		invoice.items.map((item) => ({
			quantity: num(item.quantity),
			unitPrice: num(item.unitPrice),
		})),
		num(invoice.discount),
		num(invoice.taxRate),
	);
	const paid = roundMoney(
		invoice.payments.reduce((sum, payment) => sum + num(payment.amount), 0),
	);
	return { status: invoice.status, total, paid };
}

/** An issued invoice is PAID once fully paid, and SENT again if not anymore. */
export async function settleInvoice(tx: Tx, invoiceId: string) {
	const { status, total, paid } = await invoiceBalance(tx, invoiceId);
	if (status === "SENT" && total > 0 && paid >= total)
		await tx.invoice.update({
			where: { id: invoiceId },
			data: { status: "PAID", paidAt: new Date() },
		});
	else if (status === "PAID" && paid < total)
		await tx.invoice.update({
			where: { id: invoiceId },
			data: { status: "SENT", paidAt: null },
		});
}

/**
 * Once a project has payments on issued invoices, they are its source of
 * truth: the advance becomes what was paid, and the payment status follows.
 */
export async function syncProjectPayment(tx: Tx, projectId: string | null) {
	if (!projectId) return;
	const project = await tx.project.findUnique({
		where: { id: projectId },
		select: { price: true },
	});
	const payments = await tx.invoicePayment.aggregate({
		where: { invoice: { projectId, status: { in: ["SENT", "PAID"] } } },
		_sum: { amount: true },
		_count: { _all: true },
	});
	if (!project || payments._count._all === 0) return;

	const paid = payments._sum.amount ? num(payments._sum.amount) : 0;
	const price = project.price ? num(project.price) : null;
	await tx.project.update({
		where: { id: projectId },
		data: {
			advance: paid,
			paymentStatus:
				suggestPaymentStatus(price, paid) ?? (paid > 0 ? "PARTIAL" : "UNPAID"),
		},
	});
}
