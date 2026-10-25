"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { pageCount, parseBookDesign } from "@/lib/books/design";
import { quoteSchema } from "@/lib/books/pricing";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import {
	sendBookReadyEmail,
	sendBookSentBackEmail,
} from "@/lib/mail/send-book-notices";
import { sendInvoiceEmail } from "@/lib/mail/send-invoice-email";
import { realEmail } from "@/lib/phone";
import { invoiceBalance } from "@/services/invoices/ledger";
import { formatMoney } from "@/services/projects/money";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { createBookInvoice } from "./order-invoice";
import {
	acceptOrderSchema,
	advanceSchema,
	sendBackSchema,
} from "./order-schemas";

function revalidateOrder(bookId: string, projectId: string) {
	revalidatePath("/dashboard/books", "layout");
	revalidatePath(`/portal/books/${bookId}`);
	revalidatePath(`/portal/projects/${projectId}`);
	revalidateClientWork();
}

const clientContact = {
	select: {
		id: true,
		name: true,
		email: true,
		phoneNumber: true,
		locale: true,
	},
} as const;

/**
 * Accepts an order: it is billed at the calculated price (or the one the
 * studio sets) with an invoice sent to the client, who pays as usual.
 */
export async function acceptBookOrder(
	input: unknown,
): Promise<ActionResult<{ emailed: boolean }>> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = acceptOrderSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: { id: parsed.data.id, photographerId, status: "SUBMITTED" },
		include: { client: clientContact },
	});
	const quote = quoteSchema.safeParse(book?.quote);
	const design = parseBookDesign(book?.design);
	if (!book || !quote.success || !design.success) return fail("notFound");
	const total = parsed.data.total ?? quote.data.total;

	const invoice = await db.$transaction(async (tx) => {
		// Only one request wins if the button is pressed twice.
		const { count } = await tx.photoBook.updateMany({
			where: { id: book.id, status: "SUBMITTED" },
			data: { status: "ACCEPTED", total, statusNote: "" },
		});
		if (count === 0) return null;
		const created = await createBookInvoice(tx, {
			photographerId,
			client: {
				id: book.client.id,
				name: book.client.name,
				email: realEmail(book.client.email),
				phone: book.client.phoneNumber,
			},
			title: book.title,
			pages: pageCount(design.data),
			format: design.data.format,
			quote: quote.data,
			total,
		});
		await tx.photoBook.update({
			where: { id: book.id },
			data: { invoiceId: created.id },
		});
		return created;
	});
	if (!invoice) return fail("bookWrongStatus");

	const to = realEmail(book.client.email);
	let emailed = false;
	if (to) {
		const studio = await db.studio.findUnique({
			where: { photographerId },
			select: { name: true },
		});
		const locale = resolveMailLocale(book.client.locale);
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
				console.error("Failed to send the book invoice email:", error);
				return false;
			});
	}

	revalidateOrder(book.id, book.projectId);
	return ok({ emailed });
}

/**
 * Sends the book back to the client with a note, so they can change it. If
 * the order was already accepted and nothing is paid, its invoice is cancelled.
 */
export async function sendBackBookOrder(input: unknown): Promise<ActionResult> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = sendBackSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: {
			id: parsed.data.id,
			photographerId,
			status: { in: ["SUBMITTED", "ACCEPTED"] },
		},
		include: { client: clientContact },
	});
	if (!book) return fail("notFound");

	const error = await db.$transaction(async (tx) => {
		if (book.status === "ACCEPTED" && book.invoiceId) {
			const { paid } = await invoiceBalance(tx, book.invoiceId);
			if (paid > 0) return "bookHasPayment";
			await tx.invoice.update({
				where: { id: book.invoiceId },
				data: { status: "CANCELLED" },
			});
		}
		const { count } = await tx.photoBook.updateMany({
			where: { id: book.id, status: book.status },
			data: {
				status: "DRAFT",
				invoiceId: null,
				submittedAt: null,
				statusNote: parsed.data.note,
			},
		});
		return count === 0 ? "bookWrongStatus" : null;
	});
	if (error) return fail(error);

	const to = realEmail(book.client.email);
	if (to) {
		const studio = await db.studio.findUnique({
			where: { photographerId },
			select: { name: true },
		});
		sendBookSentBackEmail({
			to,
			locale: resolveMailLocale(book.client.locale),
			studio: studio?.name ?? session.user.name,
			book: book.title,
			note: parsed.data.note,
			bookId: book.id,
		}).catch((e) =>
			console.error("Failed to send the book sent-back email:", e),
		);
	}

	revalidateOrder(book.id, book.projectId);
	return ok();
}

const FROM = {
	IN_PRODUCTION: "ACCEPTED",
	READY: "IN_PRODUCTION",
	DELIVERED: "READY",
} as const;

/** Moves an order along. Printing can start before payment: many clients pay on delivery. */
export async function advanceBookOrder(input: unknown): Promise<ActionResult> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = advanceSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, to } = parsed.data;

	const book = await db.photoBook.findFirst({
		where: { id, photographerId, status: FROM[to] },
		include: { client: clientContact },
	});
	if (!book) return fail("bookWrongStatus");

	const { count } = await db.photoBook.updateMany({
		where: { id, status: FROM[to] },
		data: { status: to },
	});
	if (count === 0) return fail("bookWrongStatus");

	const email = realEmail(book.client.email);
	if (to === "READY" && email) {
		const studio = await db.studio.findUnique({
			where: { photographerId },
			select: { name: true },
		});
		sendBookReadyEmail({
			to: email,
			locale: resolveMailLocale(book.client.locale),
			studio: studio?.name ?? session.user.name,
			book: book.title,
			bookId: id,
		}).catch((e) => console.error("Failed to send the book ready email:", e));
	}

	revalidateOrder(id, book.projectId);
	return ok();
}
