import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { pageCount, parseBookDesign, usedItemIds } from "@/lib/books/design";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import { getInvoice } from "@/services/invoices/queries";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { toBookInvoice, toBookOrder } from "./order-mapper";
import { type ListOrdersParams, ORDERS_PAGE_SIZE } from "./order-schemas";
import { getPriceList } from "./price-list";
import { photoSelect, toBookPhoto } from "./queries";
import {
	BOOK_STATUSES,
	type BookPhoto,
	type BookStatus,
	ORDER_STATUSES,
	type StudioOrderDetail,
	type StudioOrderPage,
} from "./types";

/** The studio's orders and the books it is still making for clients, most recently touched first. A client's own drafts never show. */
export async function listBookOrders(
	photographerId: string,
	{ page, q, status }: ListOrdersParams,
): Promise<StudioOrderPage> {
	const where: Prisma.PhotoBookWhereInput = {
		photographerId,
		AND: [
			{
				OR: [
					{ status: { in: [...ORDER_STATUSES] } },
					{ createdByStudio: true },
				],
			},
			...(status ? [{ status: status as BookStatus }] : []),
		],
	};
	if (q)
		where.AND = [
			...(where.AND as Prisma.PhotoBookWhereInput[]),
			{
				OR: [
					{ title: { contains: q, mode: "insensitive" } },
					{ client: { name: { contains: q, mode: "insensitive" } } },
					{ project: { title: { contains: q, mode: "insensitive" } } },
				],
			},
		];
	const total = await db.photoBook.count({ where });
	const meta = pageMeta(page, total, ORDERS_PAGE_SIZE);
	const rows = await db.photoBook.findMany({
		where,
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, ORDERS_PAGE_SIZE),
		take: ORDERS_PAGE_SIZE,
		include: {
			client: { select: { name: true } },
			project: { select: { title: true } },
			invoice: { select: { number: true, status: true } },
		},
	});
	return {
		...meta,
		items: rows.map((row) => {
			const design = parseBookDesign(row.design);
			return {
				id: row.id,
				title: row.title,
				status: row.status,
				clientName: row.client.name,
				projectTitle: row.project.title,
				pages: design.success ? pageCount(design.data) : 0,
				copies: row.copies,
				total: row.total?.toNumber() ?? null,
				submittedAt: row.submittedAt?.toISOString() ?? null,
				invoice: row.invoice,
			};
		}),
	};
}

/** How many orders are in each status, for the tabs. */
export async function countBookOrders(photographerId: string) {
	const groups = await db.photoBook.groupBy({
		by: ["status"],
		where: { photographerId, status: { in: [...ORDER_STATUSES] } },
		_count: { _all: true },
	});
	const counts = Object.fromEntries(BOOK_STATUSES.map((s) => [s, 0])) as Record<
		BookStatus,
		number
	>;
	for (const group of groups) counts[group.status] = group._count._all;
	return counts;
}

/** The photos of an order, as light copies; only this studio's own files. */
async function getOrderPhotos(photographerId: string, ids: string[]) {
	if (ids.length === 0) return {};
	const rows = await db.galleryItem.findMany({
		where: { id: { in: ids }, photographerId, type: "IMAGE" },
		select: photoSelect,
	});
	const photos: BookPhoto[] = await Promise.all(rows.map(toBookPhoto));
	return Object.fromEntries(photos.map((photo) => [photo.id, photo]));
}

/** One order with what the studio needs to decide, print and bill it. */
export async function getBookOrder(
	photographerId: string,
	bookId: string,
): Promise<StudioOrderDetail | null> {
	const row = await db.photoBook.findFirst({
		where: { id: bookId, photographerId, status: { in: [...ORDER_STATUSES] } },
		include: {
			client: {
				select: { id: true, name: true, email: true, phoneNumber: true },
			},
			project: { select: { title: true } },
		},
	});
	if (!row) return null;
	const design = parseBookDesign(row.design);
	if (!design.success) return null;

	const [photos, priceList, invoice] = await Promise.all([
		getOrderPhotos(photographerId, usedItemIds(design.data)),
		getPriceList(photographerId),
		row.invoiceId ? getInvoice(photographerId, row.invoiceId) : null,
	]);
	return {
		id: row.id,
		projectId: row.projectId,
		projectTitle: row.project.title,
		client: {
			id: row.client.id,
			name: row.client.name,
			email: realEmail(row.client.email) ?? "",
			phone: row.client.phoneNumber ?? "",
		},
		design: design.data,
		photos,
		order: toBookOrder(row, invoice && toBookInvoice(invoice)),
		priceList,
	};
}

/** A project's books as the studio sees them: its orders and the drafts it made itself. */
export async function listProjectBooksForStudio(
	photographerId: string,
	projectId: string,
) {
	return db.photoBook.findMany({
		where: {
			photographerId,
			projectId,
			OR: [{ status: { in: [...ORDER_STATUSES] } }, { createdByStudio: true }],
		},
		orderBy: { updatedAt: "desc" },
		select: { id: true, title: true, status: true, copies: true },
	});
}
