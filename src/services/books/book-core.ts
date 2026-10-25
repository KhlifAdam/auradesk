import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import {
	type BookDesign,
	mapAllSlots,
	newDesign,
	normalizeDesign,
	slotOf,
	usedItemIds,
} from "@/lib/books/design";
import { type BookFormat, MAX_BOOKS_PER_PROJECT } from "@/lib/books/formats";
import { db } from "@/lib/db";
import { GALLERY_ITEM_ORDER } from "@/services/galleries/constants";
import { bookablePhotos, getBookableProject } from "./access";

/** Photos a new book starts with: the first of the delivered ones, laid out. */
const STARTER_PHOTOS = 25;

interface BookProject {
	id: string;
	title: string;
	clientId: string;
	photographerId: string;
}

/**
 * Starts a book from a delivered project's photos, laid out and ready to
 * adjust. Shared by the client's and the studio's "new book".
 */
export async function createBookFor(
	project: BookProject,
	format: BookFormat,
	byStudio: boolean,
): Promise<ActionResult<{ id: string }>> {
	const { clientId, id: projectId } = project;
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
			createdByStudio: byStudio,
		},
		select: { id: true },
	});
	return ok({ id: book.id });
}

/**
 * Saves a book's design. Photos that aren't the client's delivered ones (or
 * were removed since) are emptied, so a design never points at someone else's
 * files, and an old reference can't make saving fail for good. `where` says
 * whose book it is: the client's or the studio's.
 */
export async function saveDesign(
	where: Prisma.PhotoBookWhereInput,
	design: BookDesign,
): Promise<ActionResult> {
	const book = await db.photoBook.findFirst({
		where,
		select: { id: true, projectId: true, clientId: true, status: true },
	});
	if (!book) return fail("notFound");
	// Once sent to the studio, the design is what they print: it can't change.
	if (book.status !== "DRAFT") return fail("bookLocked");
	const project = await getBookableProject(book.clientId, book.projectId);
	if (!project) return fail("notFound");

	const clean = normalizeDesign(design);
	const valid = new Set(
		(
			await db.galleryItem.findMany({
				where: {
					id: { in: usedItemIds(clean) },
					...bookablePhotos(book.clientId, book.projectId),
				},
				select: { id: true },
			})
		).map((item) => item.id),
	);
	const safe = mapAllSlots(clean, (slot) =>
		slot.itemId && valid.has(slot.itemId) ? slot : slotOf(null),
	);
	await db.photoBook.update({
		where: { id: book.id },
		data: { title: safe.title || project.title, design: safe },
	});
	return ok();
}

/** Deletes a draft; `where` says whose it is. Returns the project it belonged to. */
export async function deleteDraft(
	where: Prisma.PhotoBookWhereInput,
): Promise<ActionResult<{ projectId: string }>> {
	const book = await db.photoBook.findFirst({
		where,
		select: { id: true, projectId: true, status: true },
	});
	if (!book) return fail("notFound");
	if (book.status !== "DRAFT") return fail("bookLocked");
	await db.photoBook.delete({ where: { id: book.id } });
	return ok({ projectId: book.projectId });
}
