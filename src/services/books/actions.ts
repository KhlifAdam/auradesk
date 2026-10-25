"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import {
	bookDesignSchema,
	mapAllSlots,
	newDesign,
	normalizeDesign,
	slotOf,
	usedItemIds,
} from "@/lib/books/design";
import { BOOK_FORMATS, MAX_BOOKS_PER_PROJECT } from "@/lib/books/formats";
import { db } from "@/lib/db";
import { GALLERY_ITEM_ORDER } from "@/services/galleries/constants";
import { idSchema } from "@/services/shared/schemas";
import { bookablePhotos, getBookableProject } from "./access";
import { listBookPhotos } from "./queries";
import type { BookPhotoPage } from "./types";

/** Photos a new book starts with: the first of the delivered ones, laid out. */
const STARTER_PHOTOS = 25;

const createSchema = z.object({
	projectId: idSchema,
	format: z.enum(BOOK_FORMATS),
});

const projectPath = (projectId: string) => `/portal/projects/${projectId}`;

/** Starts a book from the project's delivered photos, laid out and ready to adjust. */
export async function createBook(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { clientId } = await requireClient();
	const parsed = createSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { projectId, format } = parsed.data;

	const project = await getBookableProject(clientId, projectId);
	if (!project) return fail("notFound");
	const count = await db.photoBook.count({ where: { clientId, projectId } });
	if (count >= MAX_BOOKS_PER_PROJECT) return fail("bookLimit");

	const photos = await db.galleryItem.findMany({
		where: bookablePhotos(clientId, projectId),
		orderBy: [{ gallery: { createdAt: "asc" } }, ...GALLERY_ITEM_ORDER],
		take: STARTER_PHOTOS,
		select: { id: true },
	});
	if (photos.length === 0) return fail("bookNoPhotos");

	const design = newDesign(
		format,
		project.title.slice(0, 80),
		photos.map((photo) => photo.id),
	);
	const book = await db.photoBook.create({
		data: {
			projectId,
			clientId,
			photographerId: project.photographerId,
			title: design.title,
			design,
		},
		select: { id: true },
	});
	revalidatePath(projectPath(projectId));
	return ok({ id: book.id });
}

const saveSchema = z.object({ id: idSchema, design: bookDesignSchema });

/**
 * Saves a book's design. Photos that aren't the client's delivered ones (or
 * were removed since) are emptied, so a design never points at someone else's
 * files, and an old reference can't make saving fail for good.
 */
export async function saveBook(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = saveSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: { id: parsed.data.id, clientId },
		select: { projectId: true, status: true },
	});
	if (!book) return fail("notFound");
	// Once sent to the studio, the design is what they print: it can't change.
	if (book.status !== "DRAFT") return fail("bookLocked");
	const project = await getBookableProject(clientId, book.projectId);
	if (!project) return fail("notFound");

	const design = normalizeDesign(parsed.data.design);
	const ids = usedItemIds(design);
	const valid = new Set(
		(
			await db.galleryItem.findMany({
				where: { id: { in: ids }, ...bookablePhotos(clientId, book.projectId) },
				select: { id: true },
			})
		).map((item) => item.id),
	);
	const clean = mapAllSlots(design, (slot) =>
		slot.itemId && valid.has(slot.itemId) ? slot : slotOf(null),
	);

	await db.photoBook.update({
		where: { id: parsed.data.id },
		data: { title: clean.title || project.title, design: clean },
	});
	return ok();
}

export async function deleteBook(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const book = await db.photoBook.findFirst({
		where: { id: parsed.data, clientId },
		select: { projectId: true, status: true },
	});
	if (!book) return fail("notFound");
	if (book.status !== "DRAFT") return fail("bookLocked");
	await db.photoBook.delete({ where: { id: parsed.data } });
	revalidatePath(projectPath(book.projectId));
	return ok();
}

const photosSchema = z.object({
	projectId: idSchema,
	page: z.number().int().min(1).max(10_000),
});

/** One more page of the delivered photos, for the editor's photo tray. */
export async function loadBookPhotos(
	input: unknown,
): Promise<ActionResult<BookPhotoPage>> {
	const { clientId } = await requireClient();
	const parsed = photosSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const project = await getBookableProject(clientId, parsed.data.projectId);
	if (!project) return fail("notFound");
	return ok(await listBookPhotos(clientId, project.id, parsed.data.page));
}
