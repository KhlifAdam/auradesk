"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendQuoteEmail } from "@/lib/mail/send-quote-email";
import { realEmail } from "@/lib/phone";
import { nextInvoiceNumber } from "@/services/invoices/ledger";
import { computeTotals } from "@/services/invoices/totals";
import { formatMoney } from "@/services/projects/money";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockPhotographer } from "@/services/shared/lock-rows";
import { idSchema } from "@/services/shared/schemas";
import { canInvoiceQuote } from "./options";

/** Days the client has to pay an invoice made from a quote. */
const INVOICE_DUE_DAYS = 15;

const quoteTotal = (quote: {
	discount: { toNumber(): number };
	taxRate: { toNumber(): number };
	items: {
		quantity: { toNumber(): number };
		unitPrice: { toNumber(): number };
	}[];
}) =>
	computeTotals(
		quote.items.map((item) => ({
			quantity: item.quantity.toNumber(),
			unitPrice: item.unitPrice.toNumber(),
		})),
		quote.discount.toNumber(),
		quote.taxRate.toNumber(),
	).total;

/**
 * Sends a draft to the client: they can accept or decline it in the portal.
 * Its booking, while still open, moves to "Quote sent".
 */
export async function sendQuote(
	input: unknown,
): Promise<ActionResult<{ emailed: boolean }>> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const quote = await db.quote.findFirst({
		where: { id: parsed.data, photographerId },
		include: {
			items: true,
			client: { select: { email: true, locale: true } },
			booking: { select: { id: true, status: true } },
		},
	});
	if (!quote) return fail("notFound");
	if (quote.status !== "DRAFT") return fail("quoteNotDraft");

	const booking = quote.booking;
	await db.$transaction([
		db.quote.update({
			where: { id: quote.id },
			data: { status: "SENT", sentAt: new Date() },
		}),
		...(booking && (booking.status === "NEW" || booking.status === "DISCUSSION")
			? [
					db.booking.update({
						where: { id: booking.id },
						data: { status: "QUOTE_SENT" },
					}),
					db.bookingActivity.create({
						data: {
							bookingId: booking.id,
							kind: "STATUS",
							fromStatus: booking.status,
							toStatus: "QUOTE_SENT",
						},
					}),
				]
			: []),
	]);

	// Only a client with an account can answer it online.
	const to = quote.client && realEmail(quote.client.email);
	let emailed = false;
	if (to) {
		const studio = await db.studio.findUnique({
			where: { photographerId },
			select: { name: true },
		});
		const locale = resolveMailLocale(quote.client?.locale);
		emailed = await sendQuoteEmail({
			to,
			locale,
			studio: studio?.name ?? session.user.name,
			number: quote.number,
			amount: formatMoney(quoteTotal(quote), locale),
			quoteId: quote.id,
		})
			.then(() => true)
			.catch((error) => {
				console.error("Failed to send the quote email:", error);
				return false;
			});
	}

	revalidateClientWork();
	return ok({ emailed });
}

/** Makes a draft invoice with the quote's client and lines, once. */
export async function convertQuoteToInvoice(
	input: unknown,
): Promise<ActionResult<{ invoiceId: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const result = await db.$transaction(async (tx) => {
		await lockPhotographer(tx, photographerId);
		const quote = await tx.quote.findFirst({
			where: { id: parsed.data, photographerId },
			include: {
				items: { orderBy: [{ position: "asc" }, { id: "asc" }] },
				booking: { select: { projectId: true } },
			},
		});
		if (!quote) return { error: "notFound" } as const;
		if (!canInvoiceQuote(quote.status, quote.invoiceId))
			return { error: "quoteNotInvoiceable" } as const;

		const today = new Date(new Date().toISOString().slice(0, 10));
		const due = new Date(today);
		due.setUTCDate(due.getUTCDate() + INVOICE_DUE_DAYS);
		const invoice = await tx.invoice.create({
			data: {
				photographerId,
				projectId: quote.projectId ?? quote.booking?.projectId ?? null,
				clientId: quote.clientId,
				number: await nextInvoiceNumber(
					tx,
					photographerId,
					today.getUTCFullYear(),
				),
				clientName: quote.clientName,
				clientEmail: quote.clientEmail,
				clientPhone: quote.clientPhone,
				clientAddress: quote.clientAddress,
				issueDate: today,
				dueDate: due,
				taxRate: quote.taxRate,
				discount: quote.discount,
				notes: quote.notes,
				items: {
					create: quote.items.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						position: item.position,
					})),
				},
			},
			select: { id: true },
		});
		await tx.quote.update({
			where: { id: quote.id },
			data: { invoiceId: invoice.id },
		});
		return { invoiceId: invoice.id };
	});
	if (!result.invoiceId) return fail(result.error ?? "notFound");

	revalidateClientWork();
	return ok({ invoiceId: result.invoiceId });
}
