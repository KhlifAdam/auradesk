import "server-only";

import { db } from "@/lib/db";
import { deleteObjects, publicUrl } from "@/lib/storage/r2";
import {
	abortUploads,
	deleteGalleryFiles,
	findUploadSessions,
} from "@/services/galleries/cleanup";

/** Purged per run, so one run stays short; the next one takes the rest. */
const GALLERIES_PER_RUN = 200;
/** Proofs outlive delivery a little, in case the selection is needed again. */
const PROOFS_GRACE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export const addMonths = (from: Date, months: number) => {
	const date = new Date(from);
	date.setUTCMonth(date.getUTCMonth() + months);
	return date;
};

/**
 * Deletes the galleries (rows and files) of projects delivered longer ago
 * than their studio keeps them. Studios without a retention keep everything.
 */
export async function purgeExpiredGalleries(now = new Date()) {
	const studios = await db.studio.findMany({
		where: { galleryRetentionMonths: { not: null } },
		select: { photographerId: true, galleryRetentionMonths: true },
	});
	if (studios.length === 0) return 0;

	const galleries = await db.gallery.findMany({
		where: {
			OR: studios.map((studio) => ({
				photographerId: studio.photographerId,
				project: {
					deliveredAt: {
						lt: addMonths(now, -(studio.galleryRetentionMonths ?? 0)),
					},
				},
			})),
		},
		select: { id: true },
		take: GALLERIES_PER_RUN,
	});
	return deleteGalleries(galleries.map((gallery) => gallery.id));
}

/**
 * Proofs are only there to choose from: once the project is delivered (and a
 * grace period passed), the light copies go. The finals stay.
 */
export async function purgeDeliveredProofs(now = new Date()) {
	const galleries = await db.gallery.findMany({
		where: {
			kind: "PROOFS",
			project: {
				stage: "DELIVERY",
				deliveredAt: {
					lt: new Date(now.getTime() - PROOFS_GRACE_DAYS * DAY_MS),
				},
			},
		},
		select: { id: true },
		take: GALLERIES_PER_RUN,
	});
	return deleteGalleries(galleries.map((gallery) => gallery.id));
}

/** Rows first, then their files in the bucket (best effort). */
async function deleteGalleries(ids: string[]) {
	if (ids.length === 0) return 0;

	const [files, uploads] = await Promise.all([
		db.galleryItem.findMany({
			where: { galleryId: { in: ids } },
			select: { key: true, previewKey: true },
		}),
		findUploadSessions({ galleryId: { in: ids } }),
	]);
	await db.gallery.deleteMany({ where: { id: { in: ids } } });
	await Promise.all([deleteGalleryFiles(files), abortUploads(uploads)]);
	return ids.length;
}

/**
 * Everything an account stored in the buckets, read before its rows go:
 * once the user is deleted, the cascade leaves nothing to find them by.
 */
export async function collectAccountFiles(userId: string) {
	const [galleryFiles, uploads, media, avatars] = await Promise.all([
		db.galleryItem.findMany({
			where: { photographerId: userId },
			select: { key: true, previewKey: true },
		}),
		findUploadSessions({ photographerId: userId }),
		db.media.findMany({
			where: { photographerId: userId },
			select: { key: true },
		}),
		db.user.findUnique({ where: { id: userId }, select: { image: true } }),
	]);
	// The profile photo, when it is one this app stored (not Google's).
	const base = publicUrl("");
	const avatar = avatars?.image?.startsWith(`${base}avatars/${userId}/`)
		? avatars.image.slice(base.length)
		: null;
	return {
		galleryFiles,
		uploads,
		mediaKeys: [...media.map((m) => m.key), ...(avatar ? [avatar] : [])],
	};
}

/** Best-effort removal of what `collectAccountFiles` found. */
export async function deleteAccountFiles(
	files: Awaited<ReturnType<typeof collectAccountFiles>>,
) {
	await Promise.all([
		deleteGalleryFiles(files.galleryFiles),
		abortUploads(files.uploads),
		files.mediaKeys.length > 0
			? deleteObjects(files.mediaKeys).catch((error) =>
					console.error("Failed to delete public R2 objects:", error),
				)
			: null,
	]);
}
