import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getApiUser } from "@/lib/auth/api-session";
import { db } from "@/lib/db";
import {
	CLIENT_VIEWABLE_PROJECT,
	canClientView,
	isDeliveredToClient,
} from "@/services/projects/visibility";

export interface GalleryAccess {
	/** `link`: anyone holding the client's share link, signed in or not. */
	role: "owner" | "client" | "link";
	/** Full-quality files and downloads; otherwise previews only. */
	originals: boolean;
}

/** Galleries this client may open: shared, project at Selection or later. */
export const clientGalleryWhere = (clientId: string) =>
	({
		sharedAt: { not: null },
		project: { clientId, ...CLIENT_VIEWABLE_PROJECT },
	}) satisfies Prisma.GalleryWhereInput;

/**
 * The gallery behind a share link: the same rules as for its client (shared,
 * project at Selection or later), the photographer still allowing links, and
 * the link not expired.
 */
export const linkGalleryWhere = (token: string, now = new Date()) =>
	({
		shareToken: token,
		linkSharing: true,
		sharedAt: { not: null },
		OR: [{ shareExpiresAt: null }, { shareExpiresAt: { gt: now } }],
		project: { clientId: { not: null }, ...CLIENT_VIEWABLE_PROJECT },
	}) satisfies Prisma.GalleryWhereInput;

/** Finals of a delivered, paid project: what may leave in full quality. */
export const isDeliveredFinal = (gallery: {
	kind: "PROOFS" | "FINAL";
	project: Parameters<typeof isDeliveredToClient>[0];
}) => gallery.kind === "FINAL" && isDeliveredToClient(gallery.project);

/**
 * Who may see a gallery: its photographer always, with the originals. The
 * project's client once it is shared and the project has reached Selection:
 * previews to choose from, and the originals once delivered and paid (never
 * from proofs). Returns null for everyone else.
 */
export async function getGalleryAccess(
	galleryId: string,
	userId: string,
): Promise<GalleryAccess | null> {
	const gallery = await db.gallery.findUnique({
		where: { id: galleryId },
		select: {
			photographerId: true,
			sharedAt: true,
			kind: true,
			project: { select: { clientId: true, stage: true, paymentStatus: true } },
		},
	});
	if (!gallery) return null;
	if (gallery.photographerId === userId)
		return { role: "owner", originals: true };

	const { project } = gallery;
	if (
		project.clientId !== userId ||
		!gallery.sharedAt ||
		!canClientView(project)
	)
		return null;
	return { role: "client", originals: isDeliveredFinal(gallery) };
}

/** Access through a share link: originals only if the client allowed downloads. */
export async function getLinkAccess(
	galleryId: string,
	token: string,
): Promise<GalleryAccess | null> {
	const gallery = await db.gallery.findFirst({
		where: { id: galleryId, ...linkGalleryWhere(token) },
		select: {
			kind: true,
			shareDownloads: true,
			project: { select: { stage: true, paymentStatus: true } },
		},
	});
	if (!gallery) return null;
	return {
		role: "link",
		originals: gallery.shareDownloads && isDeliveredFinal(gallery),
	};
}

/**
 * For route handlers: the signed-in viewer's access, else the share link's
 * (`?t=` in the URL). Null when neither opens the gallery.
 */
export async function requestGalleryAccess(
	request: Request,
	galleryId: string,
) {
	const user = await getApiUser();
	const access = user ? await getGalleryAccess(galleryId, user.id) : null;
	if (access) return access;
	const token = new URL(request.url).searchParams.get("t");
	return token ? getLinkAccess(galleryId, token) : null;
}

const galleryOfItem = (itemId: string) =>
	db.galleryItem.findUnique({
		where: { id: itemId },
		select: { galleryId: true },
	});

/** Same check, starting from a photo. */
export async function getItemAccess(itemId: string, userId: string) {
	const item = await galleryOfItem(itemId);
	if (!item) return null;
	const access = await getGalleryAccess(item.galleryId, userId);
	return access ? { ...access, galleryId: item.galleryId } : null;
}

/** `requestGalleryAccess`, starting from a photo. */
export async function requestItemAccess(request: Request, itemId: string) {
	const item = await galleryOfItem(itemId);
	if (!item) return null;
	const access = await requestGalleryAccess(request, item.galleryId);
	return access ? { ...access, galleryId: item.galleryId } : null;
}
