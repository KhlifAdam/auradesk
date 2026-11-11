import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createQuote, updateQuote } from "@/services/quotes/actions";
import { emptyQuoteValues, quoteToValues } from "@/services/quotes/form-values";
import { getQuote } from "@/services/quotes/queries";
import { quoteTotalOf } from "@/services/quotes/quote-total";
import type { BookingValues } from "./schemas";

export { quoteTotalOf };

/**
 * A booking's price is proposed as a quote: the latest quote made for it.
 * It goes out with the booking, the client's one answer covers both, and
 * confirming the booking needs it accepted.
 */

type Tx = Prisma.TransactionClient | typeof db;

const quoteSelect = {
	id: true,
	number: true,
	status: true,
	invoiceId: true,
	clientNote: true,
	discount: true,
	taxRate: true,
	items: {
		select: { description: true, quantity: true, unitPrice: true },
		orderBy: [{ position: "asc" }, { id: "asc" }],
	},
} satisfies Prisma.QuoteSelect;

type QuoteRow = Prisma.QuoteGetPayload<{ select: typeof quoteSelect }>;

export interface BookingQuote {
	id: string;
	number: string;
	status: QuoteRow["status"];
	invoiced: boolean;
	/** What the client wrote with their answer. */
	clientNote: string;
	discount: number;
	taxRate: number;
	lines: { description: string; quantity: number; unitPrice: number }[];
	total: number;
}

/** The booking's current quote: the latest made for it, if any. */
export function latestBookingQuote(tx: Tx, bookingId: string) {
	return tx.quote.findFirst({
		where: { bookingId },
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		select: quoteSelect,
	});
}

/** The current quote as a booking page shows it. `scope` says whose it is. */
export async function getBookingQuote(
	scope: { photographerId: string } | { clientId: string },
	bookingId: string,
): Promise<BookingQuote | null> {
	const row = await db.quote.findFirst({
		where: {
			bookingId,
			...scope,
			// The client never sees a draft.
			...("clientId" in scope && { status: { not: "DRAFT" } }),
		},
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		select: quoteSelect,
	});
	if (!row) return null;
	return {
		id: row.id,
		number: row.number,
		status: row.status,
		invoiced: row.invoiceId !== null,
		clientNote: row.clientNote,
		discount: row.discount.toNumber(),
		taxRate: row.taxRate.toNumber(),
		lines: row.items.map((item) => ({
			description: item.description,
			quantity: item.quantity.toNumber(),
			unitPrice: item.unitPrice.toNumber(),
		})),
		total: quoteTotalOf(row),
	};
}

/** The client's answer to the booking also answers its sent quote. */
export async function answerBookingQuote(
	tx: Tx,
	bookingId: string,
	accept: boolean,
) {
	const quote = await latestBookingQuote(tx, bookingId);
	// Even one already invoiced: the answer is recorded so both always agree.
	if (quote?.status !== "SENT") return;
	await tx.quote.update({
		where: { id: quote.id },
		data: {
			status: accept ? "ACCEPTED" : "DECLINED",
			respondedAt: new Date(),
		},
	});
}

/** An accepted quote of the project not invoiced yet: it becomes the invoice. */
export async function getProjectQuoteToInvoice(
	photographerId: string,
	projectId: string,
) {
	const row = await db.quote.findFirst({
		where: { photographerId, projectId, status: "ACCEPTED", invoiceId: null },
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		select: quoteSelect,
	});
	return row && { id: row.id, number: row.number, total: quoteTotalOf(row) };
}

/**
 * Saves the booking form's quote: its current one is updated while it can
 * change (a version the client saw goes back to a draft), else a new one is
 * made. Either way the booking's price becomes the quote total.
 */
export async function saveBookingQuote(
	photographerId: string,
	bookingId: string,
	values: Pick<
		BookingValues,
		| "clientName"
		| "clientEmail"
		| "clientPhone"
		| "items"
		| "discount"
		| "taxRate"
		| "responseDeadline"
	>,
) {
	const lines = {
		clientName: values.clientName,
		clientEmail: values.clientEmail,
		clientPhone: values.clientPhone,
		items: values.items,
		discount: values.discount,
		taxRate: values.taxRate,
	};
	const current = await latestBookingQuote(db, bookingId);
	const editable =
		current &&
		!current.invoiceId &&
		["DRAFT", "SENT", "ACCEPTED"].includes(current.status);
	if (editable) {
		const detail = await getQuote(photographerId, current.id);
		if (detail)
			return updateQuote({
				...quoteToValues(detail),
				...lines,
				id: current.id,
			});
	}
	return createQuote(
		emptyQuoteValues({
			bookingId,
			...lines,
			...(values.responseDeadline && { dueDate: values.responseDeadline }),
		}),
	);
}
