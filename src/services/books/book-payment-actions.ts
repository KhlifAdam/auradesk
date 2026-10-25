"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { invoiceBalance, settleInvoice } from "@/services/invoices/ledger";
import { PAYMENT_METHODS } from "@/services/invoices/options";
import { roundMoney } from "@/services/invoices/totals";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { idSchema } from "@/services/shared/schemas";

const paidSchema = z.object({
	id: idSchema,
	paid: z.boolean(),
	method: z.enum(PAYMENT_METHODS).default("CASH"),
});

/**
 * Marks a book order's invoice as paid (records what is left, today) or not
 * paid (removes its payments). The quick switch for studios that are paid in
 * cash on delivery; the invoice page still handles partial payments.
 */
export async function setBookPaid(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = paidSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, paid, method } = parsed.data;

	const book = await db.photoBook.findFirst({
		where: { id, photographerId },
		select: { invoiceId: true, projectId: true },
	});
	if (!book?.invoiceId) return fail("notFound");
	const invoiceId = book.invoiceId;

	const error = await db.$transaction(async (tx) => {
		// The row lock keeps two clicks from paying the invoice twice.
		await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} AND photographer_id = ${photographerId} FOR UPDATE`;
		const {
			status,
			total,
			paid: already,
		} = await invoiceBalance(tx, invoiceId);
		if (status !== "SENT" && status !== "PAID") return "invoiceNotPayable";
		if (paid) {
			const left = roundMoney(total - already);
			if (left > 0)
				await tx.invoicePayment.create({
					data: { invoiceId, amount: left, paidAt: new Date(), method },
				});
		} else await tx.invoicePayment.deleteMany({ where: { invoiceId } });
		await settleInvoice(tx, invoiceId);
		return null;
	});
	if (error) return fail(error);

	revalidatePath("/dashboard/books", "layout");
	revalidatePath(`/dashboard/invoices/${invoiceId}`);
	revalidatePath(`/portal/books/${id}`);
	revalidateClientWork();
	return ok();
}
