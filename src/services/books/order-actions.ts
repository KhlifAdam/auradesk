"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { pageCount, parseBookDesign } from "@/lib/books/design";
import { bookOrderOptionsSchema, computeQuote } from "@/lib/books/pricing";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendBookOrderEmail } from "@/lib/mail/send-book-notices";
import { realEmail } from "@/lib/phone";
import { formatMoney } from "@/services/projects/money";
import { idSchema } from "@/services/shared/schemas";
import { getBookableProject } from "./access";
import { getPriceList } from "./price-list";

const submitSchema = z.object({
	id: idSchema,
	options: bookOrderOptionsSchema,
});

function revalidateBook(bookId: string, projectId: string) {
	revalidatePath(`/portal/books/${bookId}`);
	revalidatePath(`/portal/projects/${projectId}`);
	revalidatePath("/dashboard/books");
}

/**
 * Sends the book to the studio to be printed. The price is worked out here
 * from the studio's price list, never taken from the browser; from now on the
 * design can't change, so what the studio prints is what the client approved.
 */
export async function submitBook(input: unknown): Promise<ActionResult> {
	const { clientId, session } = await requireClient();
	const parsed = submitSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, options } = parsed.data;

	const book = await db.photoBook.findFirst({
		where: { id, clientId, createdByStudio: false },
	});
	if (!book) return fail("notFound");
	if (book.status !== "DRAFT") return fail("bookLocked");
	const project = await getBookableProject(clientId, book.projectId);
	if (!project) return fail("notFound");
	const design = parseBookDesign(book.design);
	if (!design.success) return fail("invalidInput");
	if (!design.data.cover.itemId) return fail("bookNoCover");

	const priceList = await getPriceList(book.photographerId);
	const pages = pageCount(design.data);
	const quoted = computeQuote(
		priceList,
		{ format: design.data.format, pages },
		options,
	);
	if (!quoted.ok) return fail(quoted.error);
	const { quote } = quoted;

	// Only one request wins if the button is pressed twice.
	const { count } = await db.photoBook.updateMany({
		where: { id, clientId, createdByStudio: false, status: "DRAFT" },
		data: {
			status: "SUBMITTED",
			copies: options.copies,
			options: options as Prisma.InputJsonValue,
			clientNote: options.note,
			quote: quote as unknown as Prisma.InputJsonValue,
			total: quote.total,
			statusNote: "",
			submittedAt: new Date(),
		},
	});
	if (count === 0) return fail("bookLocked");

	const studio = await db.user.findUnique({
		where: { id: book.photographerId },
		select: { email: true, locale: true },
	});
	const to = studio && realEmail(studio.email);
	if (to) {
		const locale = resolveMailLocale(studio.locale);
		sendBookOrderEmail({
			to,
			locale,
			client: session.user.name,
			book: book.title,
			project: project.title,
			pages,
			copies: options.copies,
			total: formatMoney(quote.total, locale),
			bookId: id,
		}).catch((error) =>
			console.error("Failed to send the book order email:", error),
		);
	}

	revalidateBook(id, book.projectId);
	return ok();
}

/** Takes the book back before the studio has answered, to change it. */
export async function withdrawBook(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: { id: parsed.data, clientId },
		select: { projectId: true },
	});
	if (!book) return fail("notFound");
	const { count } = await db.photoBook.updateMany({
		where: { id: parsed.data, clientId, status: "SUBMITTED" },
		data: { status: "DRAFT", submittedAt: null },
	});
	if (count === 0) return fail("bookWrongStatus");

	revalidateBook(parsed.data, book.projectId);
	return ok();
}
