import "server-only";

import type { PhotoBook } from "@/generated/prisma/client";
import { pageCount, parseBookDesign, usedItemIds } from "@/lib/books/design";
import { db } from "@/lib/db";
import { getPrivateViewUrl } from "@/lib/storage/r2-private";
import { GALLERY_ITEM_ORDER } from "@/services/galleries/constants";
import { proofUrl } from "@/services/galleries/sign-items";
import { getClientInvoice } from "@/services/invoices/queries";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { bookablePhotos, getBookableProject } from "./access";
import { toBookInvoice, toBookOrder } from "./order-mapper";
import { getPriceList } from "./price-list";
import type { BookPhoto, BookPhotoPage, BookSummary, BookView } from "./types";

export const BOOK_PHOTOS_PAGE_SIZE = 60;

export const photoSelect = {
	id: true,
	previewKey: true,
	type: true,
	filename: true,
	width: true,
	height: true,
} as const;

type PhotoRow = {
	id: string;
	previewKey: string | null;
	type: "IMAGE" | "VIDEO";
	filename: string;
	width: number | null;
	height: number | null;
};

/** A light copy to draw in the editor: the signed preview, or the app's own proofing copy. */
export async function toBookPhoto(row: PhotoRow): Promise<BookPhoto> {
	const url = row.previewKey
		? await getPrivateViewUrl(row.previewKey)
		: (proofUrl(row, false) as string);
	return {
		id: row.id,
		url,
		width: row.width,
		height: row.height,
		filename: row.filename,
	};
}

/** The delivered photos of a project, a page at a time, in gallery order. */
export async function listBookPhotos(
	clientId: string,
	projectId: string,
	page: number,
): Promise<BookPhotoPage> {
	const where = bookablePhotos(clientId, projectId);
	const total = await db.galleryItem.count({ where });
	const meta = pageMeta(page, total, BOOK_PHOTOS_PAGE_SIZE);
	const rows = await db.galleryItem.findMany({
		where,
		orderBy: [{ gallery: { createdAt: "asc" } }, ...GALLERY_ITEM_ORDER],
		skip: pageSkip(meta.page, BOOK_PHOTOS_PAGE_SIZE),
		take: BOOK_PHOTOS_PAGE_SIZE,
		select: photoSelect,
	});
	return { ...meta, items: await Promise.all(rows.map(toBookPhoto)) };
}

/** Specific delivered photos by id; ids that aren't the client's (or deleted) are left out. */
export async function getBookPhotos(
	clientId: string,
	projectId: string,
	ids: string[],
): Promise<Record<string, BookPhoto>> {
	if (ids.length === 0) return {};
	const rows = await db.galleryItem.findMany({
		where: { id: { in: ids }, ...bookablePhotos(clientId, projectId) },
		select: photoSelect,
	});
	const photos = await Promise.all(rows.map(toBookPhoto));
	return Object.fromEntries(photos.map((photo) => [photo.id, photo]));
}

/** What a client sees of their books: not the drafts the studio is still making for them. */
const clientVisible = {
	NOT: { createdByStudio: true, status: "DRAFT" },
} as const;

export async function listProjectBooks(
	clientId: string,
	projectId: string,
): Promise<BookSummary[]> {
	const rows = await db.photoBook.findMany({
		where: { clientId, projectId, ...clientVisible },
		orderBy: { updatedAt: "desc" },
	});
	const designs = rows.map((row) => parseBookDesign(row.design));
	const coverIds = designs.flatMap((d) =>
		d.success && d.data.cover.itemId ? [d.data.cover.itemId] : [],
	);
	const covers = await getBookPhotos(clientId, projectId, coverIds);
	return rows.map((row, i) => {
		const design = designs[i];
		const cover = design.success && design.data.cover.itemId;
		return {
			id: row.id,
			title: row.title,
			status: row.status,
			pageCount: design.success ? pageCount(design.data) : 0,
			updatedAt: row.updatedAt.toISOString(),
			coverUrl: (cover && covers[cover]?.url) || null,
		};
	});
}

/** A book to edit or follow, with the photos it uses. Null when it isn't the client's or the project isn't delivered. */
export async function getBook(
	clientId: string,
	bookId: string,
): Promise<BookView | null> {
	const row = await db.photoBook.findFirst({
		where: { id: bookId, clientId, ...clientVisible },
	});
	if (!row) return null;
	return toView(row, clientId);
}

/** A studio-made draft to edit, with the client's delivered photos it uses. */
export async function getStudioDraft(
	photographerId: string,
	bookId: string,
): Promise<BookView | null> {
	const row = await db.photoBook.findFirst({
		where: {
			id: bookId,
			photographerId,
			createdByStudio: true,
			status: "DRAFT",
		},
	});
	return row ? toView(row, row.clientId) : null;
}

async function toView(
	row: PhotoBook,
	clientId: string,
): Promise<BookView | null> {
	const design = parseBookDesign(row.design);
	const project = await getBookableProject(clientId, row.projectId);
	if (!design.success || !project) return null;

	const [photos, priceList, invoice, studio] = await Promise.all([
		getBookPhotos(clientId, row.projectId, usedItemIds(design.data)),
		getPriceList(row.photographerId),
		row.invoiceId ? getClientInvoice(clientId, row.invoiceId) : null,
		db.studio.findUnique({
			where: { photographerId: row.photographerId },
			select: { name: true },
		}),
	]);
	return {
		id: row.id,
		projectId: row.projectId,
		projectTitle: project.title,
		studioName: studio?.name ?? "",
		design: design.data,
		photos,
		order: toBookOrder(row, invoice && toBookInvoice(invoice)),
		priceList,
	};
}
