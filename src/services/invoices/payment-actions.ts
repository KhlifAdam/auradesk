"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { emptyToNull } from "@/services/shared/schemas";
import { invoiceBalance, settleInvoice, syncProjectPayment } from "./ledger";
import { deletePaymentSchema, paymentSchema } from "./schemas";
import { roundMoney } from "./totals";

/** Records money received on an issued invoice; never more than what's left. */
export async function recordPayment(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = paymentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { invoiceId, amount, paidAt, method, reference } = parsed.data;
	const error = await db.$transaction(async (tx) => {
		// The row lock keeps two payments from overpaying the invoice together.
		await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} AND photographer_id = ${photographerId} FOR UPDATE`;
		const invoice = await tx.invoice.findFirst({
			where: { id: invoiceId, photographerId },
			select: { status: true, projectId: true },
		});
		if (!invoice) return "notFound";
		if (invoice.status !== "SENT") return "invoiceNotPayable";

		const { total, paid } = await invoiceBalance(tx, invoiceId);
		if (roundMoney(paid + (amount ?? 0)) > total) return "overpayment";

		await tx.invoicePayment.create({
			data: {
				invoiceId,
				amount: amount ?? 0,
				paidAt: new Date(paidAt),
				method,
				reference: emptyToNull(reference),
			},
		});
		await settleInvoice(tx, invoiceId);
		await syncProjectPayment(tx, invoice.projectId);
		return null;
	});
	if (error) return fail(error);

	revalidateClientWork();
	return ok();
}

export async function deletePayment(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = deletePaymentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { invoiceId, paymentId } = parsed.data;
	const error = await db.$transaction(async (tx) => {
		const invoice = await tx.invoice.findFirst({
			where: { id: invoiceId, photographerId },
			select: { status: true, projectId: true },
		});
		if (!invoice) return "notFound";
		if (invoice.status === "CANCELLED") return "invoiceLocked";

		const { count } = await tx.invoicePayment.deleteMany({
			where: { id: paymentId, invoiceId },
		});
		if (count === 0) return "notFound";
		await settleInvoice(tx, invoiceId);
		await syncProjectPayment(tx, invoice.projectId);
		return null;
	});
	if (error) return fail(error);

	revalidateClientWork();
	return ok();
}
