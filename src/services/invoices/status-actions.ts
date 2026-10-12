"use server";

import { getTranslations } from "next-intl/server";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendInvoiceEmail } from "@/lib/mail/send-invoice-email";
import { realEmail } from "@/lib/phone";
import { formatMoney } from "@/services/projects/money";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { idSchema } from "@/services/shared/schemas";
import { invoiceBalance, settleInvoice, syncProjectPayment } from "./ledger";
import { roundMoney } from "./totals";

/**
 * The advance already noted on the project becomes the first payment of its
 * first issued invoice, so the invoice shows what is really left to pay.
 */
async function carryProjectAdvance(
	tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
	invoiceId: string,
	projectId: string | null,
	total: number,
) {
	if (!projectId) return;
	const [project, existing] = await Promise.all([
		tx.project.findUnique({
			where: { id: projectId },
			select: { advance: true },
		}),
		tx.invoicePayment.count({ where: { invoice: { projectId } } }),
	]);
	const advance = project ? project.advance.toNumber() : 0;
	if (advance <= 0 || existing > 0) return;

	const t = await getTranslations("Invoices.payments");
	await tx.invoicePayment.create({
		data: {
			invoiceId,
			amount: roundMoney(Math.min(advance, total)),
			paidAt: new Date(),
			method: "OTHER",
			reference: t("advanceReference"),
		},
	});
}

/** Issues a draft: it gets dated as sent and the client is told by email. */
export async function sendInvoice(
	input: unknown,
): Promise<ActionResult<{ emailed: boolean }>> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const invoice = await db.invoice.findFirst({
		where: { id: parsed.data, photographerId },
		select: {
			id: true,
			number: true,
			status: true,
			projectId: true,
			client: { select: { email: true, locale: true } },
		},
	});
	if (!invoice) return fail("notFound");
	if (invoice.status !== "DRAFT") return fail("invoiceNotDraft");

	const total = await db.$transaction(async (tx) => {
		await tx.invoice.update({
			where: { id: invoice.id },
			data: { status: "SENT", sentAt: new Date() },
		});
		const balance = await invoiceBalance(tx, invoice.id);
		await carryProjectAdvance(tx, invoice.id, invoice.projectId, balance.total);
		await settleInvoice(tx, invoice.id);
		await syncProjectPayment(tx, invoice.projectId);
		return balance.total;
	});

	// Only a client with an account can open it; others get a printed copy.
	const to = invoice.client && realEmail(invoice.client.email);
	let emailed = false;
	if (to) {
		const studio = await db.studio.findUnique({
			where: { photographerId },
			select: { name: true },
		});
		const locale = resolveMailLocale(invoice.client?.locale);
		emailed = await sendInvoiceEmail({
			to,
			locale,
			studio: studio?.name ?? session.user.name,
			number: invoice.number,
			amount: formatMoney(total, locale),
			invoiceId: invoice.id,
		})
			.then(() => true)
			.catch((error) => {
				console.error("Failed to send the invoice email:", error);
				return false;
			});
	}

	revalidateClientWork();
	return ok({ emailed });
}

/** Voids an issued invoice; its payments no longer count for the project. */
export async function cancelInvoice(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const invoice = await db.invoice.findFirst({
		where: { id: parsed.data, photographerId },
		select: { status: true, projectId: true },
	});
	if (!invoice) return fail("notFound");
	if (invoice.status === "DRAFT") return fail("invoiceNotIssued");
	if (invoice.status === "CANCELLED") return ok();

	await db.$transaction(async (tx) => {
		await tx.invoice.update({
			where: { id: parsed.data },
			data: { status: "CANCELLED", paidAt: null },
		});
		await syncProjectPayment(tx, invoice.projectId);
	});

	revalidateClientWork();
	return ok();
}
