import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { flaggedItemWhere } from "@/services/ai/photo-flags";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import {
	clientGalleryWhere,
	isDeliveredFinal,
	linkGalleryWhere,
} from "./access";
import { GALLERY_ITEM_ORDER, GALLERY_PAGE_SIZE } from "./constants";
import { coverImageUrl, coverItemOf } from "./cover";
import { galleryItemSelect, toGalleryPhoto } from "./sign-items";
import type { GalleryFilter, GalleryView } from "./types";

export { GALLERY_ITEM_ORDER } from "./constants";

interface ViewParams {
	page: number;
	filter: GalleryFilter;
}

/**
 * Loads one page of a gallery. `where` must already scope it to the viewer;
 * a client only gets the originals once the project is delivered and paid.
 */
async function loadGalleryView(
	where: Prisma.GalleryWhereInput,
	{ page, filter }: ViewParams,
	viewer: "owner" | "client" | { token: string },
): Promise<GalleryView | null> {
	const gallery = await db.gallery.findFirst({
		where,
		include: {
			project: {
				select: {
					id: true,
					title: true,
					stage: true,
					paymentStatus: true,
					eventDate: true,
				},
			},
			photographer: { select: { studio: { select: { name: true } } } },
		},
	});
	if (!gallery) return null;
	const owner = viewer === "owner";
	const token = typeof viewer === "object" ? viewer.token : undefined;
	// Proofs are light copies: never originals from them. Link visitors get
	// them only if the client allowed downloads.
	const deliveredFinal = isDeliveredFinal(gallery);
	const originals =
		owner || (deliveredFinal && (!token || gallery.shareDownloads));
	// Clients never see the assistant's flags, nor filter by them.
	const view = !owner && filter === "flagged" ? "all" : filter;

	const itemWhere: Prisma.GalleryItemWhereInput = { galleryId: gallery.id };
	if (view === "selected") itemWhere.selected = true;
	if (view === "flagged") Object.assign(itemWhere, flaggedItemWhere);

	const [total, selectedCount, coverItem] = await Promise.all([
		db.galleryItem.count({ where: itemWhere }),
		db.galleryItem.count({ where: { galleryId: gallery.id, selected: true } }),
		coverItemOf(gallery),
	]);
	const meta = pageMeta(page, total, GALLERY_PAGE_SIZE);
	const rows = await db.galleryItem.findMany({
		where: itemWhere,
		orderBy: GALLERY_ITEM_ORDER,
		skip: pageSkip(meta.page, GALLERY_PAGE_SIZE),
		take: GALLERY_PAGE_SIZE,
		select: galleryItemSelect,
	});

	return {
		...meta,
		id: gallery.id,
		projectId: gallery.project.id,
		projectTitle: gallery.project.title,
		title: gallery.title,
		description: gallery.description ?? "",
		selectionEnabled: gallery.selectionEnabled,
		selectionLimit: gallery.selectionLimit,
		kind: gallery.kind,
		watermark: gallery.watermark,
		studioName: gallery.photographer.studio?.name ?? null,
		cover: {
			template: gallery.coverTemplate,
			itemId: coverItem?.id ?? null,
			imageUrl: coverItem
				? await coverImageUrl(coverItem, originals, token)
				: null,
			focalX: gallery.coverFocalX,
			focalY: gallery.coverFocalY,
			date: gallery.project.eventDate?.toISOString() ?? null,
		},
		linkSharing: gallery.linkSharing,
		// Only its owner and client may see (and manage) the link itself.
		share:
			!token && gallery.shareToken
				? {
						token: gallery.shareToken,
						downloads: gallery.shareDownloads,
						expiresAt: gallery.shareExpiresAt?.toISOString() ?? null,
					}
				: null,
		selectedCount,
		shared: Boolean(gallery.sharedAt),
		submitted: Boolean(gallery.submittedAt),
		filter: view,
		originals,
		isLink: gallery.externalUrl !== null,
		// Like the files, the link opens once the delivery is the client's.
		externalUrl:
			owner || (deliveredFinal && !token) ? gallery.externalUrl : null,
		items: await Promise.all(
			rows.map((row) =>
				toGalleryPhoto(row, {
					originals,
					showFlags: owner,
					// Delivered finals aren't protected any more.
					marked: gallery.watermark && !deliveredFinal,
					token,
				}),
			),
		),
	};
}

export function getOwnedGallery(
	photographerId: string,
	galleryId: string,
	params: ViewParams,
) {
	return loadGalleryView({ id: galleryId, photographerId }, params, "owner");
}

export function getClientGallery(
	clientId: string,
	galleryId: string,
	params: ViewParams,
) {
	return loadGalleryView(
		{ id: galleryId, ...clientGalleryWhere(clientId) },
		params,
		"client",
	);
}

/** The view-only gallery behind a share link, or null if it no longer works. */
export function getLinkGallery(token: string, params: ViewParams) {
	return loadGalleryView(linkGalleryWhere(token), params, { token });
}

/**
 * The project of a gallery that belongs to this client's project but isn't
 * open to them (made private, or the project went back before Selection).
 * Lets the page send them to the project instead of a dead end.
 */
export async function findHiddenGalleryProject(
	clientId: string,
	galleryId: string,
) {
	const gallery = await db.gallery.findFirst({
		where: { id: galleryId, project: { clientId } },
		select: { projectId: true },
	});
	return gallery?.projectId ?? null;
}
