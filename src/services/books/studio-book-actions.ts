"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import {
	bookDesignSchema,
	pageCount,
	parseBookDesign,
} from "@/lib/books/design";
import { BOOK_FORMATS } from "@/lib/books/formats";
import { bookOrderOptionsSchema, computeQuote } from "@/lib/books/pricing";
import { db } from "@/lib/db";
import { searchQuerySchema } from "@/services/clients/schemas";
import { CLIENT_DELIVERED_PROJECT } from "@/services/projects/visibility";
import { idSchema } from "@/services/shared/schemas";
import { createBookFor, deleteDraft, saveDesign } from "./book-core";
import { getPriceList } from "./price-list";
import { listBookPhotos } from "./queries";
import { acceptBookOrder } from "./studio-order-actions";
import type { BookPhotoPage } from "./types";

const deliveredOf = (photographerId: string) =>
	({
		photographerId,
		clientId: { not: null },
		...CLIENT_DELIVERED_PROJECT,
	}) as const;

export interface BookableProject {
	id: string;
	title: string;
	clientName: string;
}

/** Delivered projects the studio can make a book for, matched by project or client name. */
export async function searchBookableProjects(
	input: unknown,
): Promise<ActionResult<BookableProject[]>> {
	const { photographerId } = await requirePhotographer();
	const q = searchQuerySchema.safeParse(input);
	if (!q.success) return failFromZod(q.error);
	const rows = await db.project.findMany({
		where: {
			...deliveredOf(photographerId),
			...(q.data && {
				OR: [
					{ title: { contains: q.data, mode: "insensitive" } },
					{ client: { name: { contains: q.data, mode: "insensitive" } } },
				],
			}),
		},
		orderBy: { updatedAt: "desc" },
		take: 8,
		select: { id: true, title: true, client: { select: { name: true } } },
	});
	return ok(
		rows.map((row) => ({
			id: row.id,
			title: row.title,
			clientName: row.client?.name ?? "",
		})),
	);
}

const createSchema = z.object({
	projectId: idSchema,
	format: z.enum(BOOK_FORMATS),
});

/** Starts a book for a client from their delivered photos; only the studio sees it until it is ordered. */
export async function createStudioBook(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = createSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const project = await db.project.findFirst({
		where: { id: parsed.data.projectId, ...deliveredOf(photographerId) },
		select: { id: true, title: true, clientId: true, photographerId: true },
	});
	if (!project) return fail("notFound");
	if (!project?.clientId) return fail("notFound");
	const result = await createBookFor(
		{ ...project, clientId: project.clientId },
		parsed.data.format,
		true,
	);
	if (result.ok) revalidatePath("/dashboard/books", "layout");
	return result;
}

const studioDraft = (id: string, photographerId: string) => ({
	id,
	photographerId,
	createdByStudio: true,
});

export async function saveStudioBook(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = z
		.object({ id: idSchema, design: bookDesignSchema })
		.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	return saveDesign(
		studioDraft(parsed.data.id, photographerId),
		parsed.data.design,
	);
}

export async function deleteStudioBook(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const result = await deleteDraft(studioDraft(parsed.data, photographerId));
	if (!result.ok) return result;
	revalidatePath("/dashboard/books", "layout");
	return ok();
}

/** One more page of the client's delivered photos, for the studio's editor tray. */
export async function loadStudioBookPhotos(
	input: unknown,
): Promise<ActionResult<BookPhotoPage>> {
	const { photographerId } = await requirePhotographer();
	const parsed = z
		.object({ projectId: idSchema, page: z.number().int().min(1).max(10_000) })
		.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const project = await db.project.findFirst({
		where: { id: parsed.data.projectId, ...deliveredOf(photographerId) },
		select: { id: true, clientId: true },
	});
	if (!project?.clientId) return fail("notFound");
	return ok(
		await listBookPhotos(project.clientId, project.id, parsed.data.page),
	);
}

const placeSchema = z.object({
	id: idSchema,
	options: bookOrderOptionsSchema,
	/** Overrides the calculated total; null keeps it. */
	total: z.number().min(0).max(999_999).nullable(),
});

/**
 * Places the order for the client: priced from the studio's list, accepted and
 * invoiced right away (the studio is both sides), so the client only has to pay.
 */
export async function placeStudioOrder(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = placeSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, options, total } = parsed.data;

	const book = await db.photoBook.findFirst({
		where: studioDraft(id, photographerId),
	});
	if (!book) return fail("notFound");
	if (book.status !== "DRAFT") return fail("bookLocked");
	const design = parseBookDesign(book.design);
	if (!design.success) return fail("invalidInput");
	if (!design.data.cover.itemId) return fail("bookNoCover");

	const quoted = computeQuote(
		await getPriceList(photographerId),
		{ format: design.data.format, pages: pageCount(design.data) },
		options,
	);
	if (!quoted.ok) return fail(quoted.error);

	const { count } = await db.photoBook.updateMany({
		where: { ...studioDraft(id, photographerId), status: "DRAFT" },
		data: {
			status: "SUBMITTED",
			copies: options.copies,
			options: options as Prisma.InputJsonValue,
			clientNote: options.note,
			quote: quoted.quote as unknown as Prisma.InputJsonValue,
			total: quoted.quote.total,
			statusNote: "",
			submittedAt: new Date(),
		},
	});
	if (count === 0) return fail("bookLocked");

	const accepted = await acceptBookOrder({ id, total });
	if (!accepted.ok) {
		// Back to a draft, so nothing is left half done.
		await db.photoBook.updateMany({
			where: { id, status: "SUBMITTED" },
			data: { status: "DRAFT", submittedAt: null },
		});
		return accepted;
	}
	return ok();
}
