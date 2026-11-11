"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import {
	bookDesignSchema,
	pageCount,
	parseBookDesign,
} from "@/lib/books/design";
import { bookOrderOptionsSchema, computeQuote } from "@/lib/books/pricing";
import { db } from "@/lib/db";
import { invoiceBalance } from "@/services/invoices/ledger";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { idSchema } from "@/services/shared/schemas";
import { getBookableProject } from "./access";
import { cleanDesign } from "./book-core";
import { bookInvoiceLines } from "./order-invoice";
import { getPriceList } from "./price-list";

/** Orders the studio may still redesign: sent or accepted, not yet printing. */
const EDITABLE = ["SUBMITTED", "ACCEPTED"] as const;

const saveSchema = z.object({ id: idSchema, design: bookDesignSchema });

/**
 * The studio changes an order's design before printing. Same pages and
 * format: the price stays. Otherwise the order is repriced from the price
 * list (a custom price is dropped) and, once accepted, its invoice lines are
 * rewritten under the same number, unless something is already paid.
 */
export async function saveOrderDesign(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = saveSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: { id: parsed.data.id, photographerId },
	});
	if (!book) return fail("notFound");
	if (!(EDITABLE as readonly string[]).includes(book.status))
		return fail("bookLocked");
	const project = await getBookableProject(book.clientId, book.projectId);
	if (!project) return fail("notFound");

	const design = await cleanDesign(book, parsed.data.design);
	const title = design.title || project.title;
	const before = parseBookDesign(book.design);
	const samePrice =
		before.success &&
		before.data.format === design.format &&
		pageCount(before.data) === pageCount(design);

	if (samePrice) {
		await db.photoBook.update({
			where: { id: book.id },
			// The client approves the new design before printing.
			data: { title, design, awaitingApprovalAt: new Date() },
		});
		revalidateClientWork();
		return ok();
	}

	const options = bookOrderOptionsSchema.safeParse(book.options);
	if (!options.success) return fail("invalidInput");
	const quoted = computeQuote(
		await getPriceList(photographerId),
		{ format: design.format, pages: pageCount(design) },
		options.data,
	);
	if (!quoted.ok) return fail(quoted.error);
	const { quote } = quoted;

	const error = await db
		.$transaction(async (tx) => {
			const { count } = await tx.photoBook.updateMany({
				where: { id: book.id, status: book.status },
				data: {
					title,
					design,
					awaitingApprovalAt: new Date(),
					quote: quote as unknown as Prisma.InputJsonValue,
					total: quote.total,
				},
			});
			if (count === 0) return "bookWrongStatus";
			if (!book.invoiceId) return null;

			const { paid } = await invoiceBalance(tx, book.invoiceId);
			if (paid > 0) throw new PaidError();
			const { items, discount } = await bookInvoiceLines({
				title,
				pages: pageCount(design),
				format: design.format,
				quote,
				total: quote.total,
			});
			await tx.invoiceItem.deleteMany({ where: { invoiceId: book.invoiceId } });
			await tx.invoice.update({
				where: { id: book.invoiceId },
				data: { discount, items: { create: items } },
			});
			return null;
		})
		.catch((e) => {
			// A payment means the price can't move: nothing was saved.
			if (e instanceof PaidError) return "bookPricePaid";
			throw e;
		});
	if (error) return fail(error);

	revalidateClientWork();
	return ok();
}

class PaidError extends Error {}
