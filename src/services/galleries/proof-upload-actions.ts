"use server";

import { randomUUID } from "node:crypto";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
	getPrivateUploadUrl,
	headPrivateObject,
} from "@/lib/storage/r2-private";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockGallery } from "@/services/shared/lock-rows";
import {
	GALLERY_ITEMS_LIMIT,
	galleryKeyPrefix,
	PREVIEW_MIME_TYPE,
} from "./constants";
import { completeProofSchema, startProofSchema } from "./schemas";

// Proofs galleries store only the browser's light copy of each photo (a few
// hundred KB). The original stays on the photographer's disk; its name, size
// and date are kept to find it again once the photos are chosen.

const ownProofs = (photographerId: string, galleryId: string) =>
	db.gallery.findFirst({
		where: { id: galleryId, photographerId, kind: "PROOFS" },
		select: { _count: { select: { items: true } } },
	});

/** The same original sent twice (same name and size) is skipped. */
const alreadyIn = (galleryId: string, filename: string, size: number) =>
	db.galleryItem.findFirst({
		where: {
			galleryId,
			originalSize: BigInt(size),
			OR: [{ filename }, { originalFilename: filename }],
		},
		select: { id: true },
	});

export async function startProofUpload(
	input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string } | null>> {
	const { photographerId } = await requirePhotographer();
	const parsed = startProofSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, filename, originalSize, proofSize } = parsed.data;

	const gallery = await ownProofs(photographerId, galleryId);
	if (!gallery) return fail("notFound");
	if (gallery._count.items >= GALLERY_ITEMS_LIMIT) return fail("galleryFull");
	// Null: nothing to send, the photo is already there.
	if (await alreadyIn(galleryId, filename, originalSize)) return ok(null);

	const key = `${galleryKeyPrefix(photographerId, galleryId)}${randomUUID()}.jpg`;
	const uploadUrl = await getPrivateUploadUrl(
		key,
		PREVIEW_MIME_TYPE,
		proofSize,
	);
	return ok({ key, uploadUrl });
}

export async function completeProofUpload(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = completeProofSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const {
		galleryId,
		key,
		proofSize,
		originalSize,
		originalModifiedAt,
		...meta
	} = parsed.data;

	// Keys are namespaced by owner and gallery; never accept another one's.
	if (!key.startsWith(galleryKeyPrefix(photographerId, galleryId)))
		return fail("invalidInput");
	if (!(await ownProofs(photographerId, galleryId))) return fail("notFound");
	const stored = await headPrivateObject(key);
	if (stored?.size !== proofSize) return fail("uploadMissing");

	const result = await db
		.$transaction(async (tx) => {
			await lockGallery(tx, galleryId);
			const stats = await tx.galleryItem.aggregate({
				where: { galleryId },
				_max: { position: true },
				_count: true,
			});
			if (stats._count >= GALLERY_ITEMS_LIMIT) return fail("galleryFull");
			await tx.galleryItem.create({
				data: {
					galleryId,
					photographerId,
					key,
					filename: meta.filename,
					mimeType: PREVIEW_MIME_TYPE,
					size: BigInt(proofSize),
					type: "IMAGE",
					width: meta.width,
					height: meta.height,
					capturedAt: meta.capturedAt ? new Date(meta.capturedAt) : null,
					camera: meta.camera,
					// Read in the browser from the original: nothing left to read.
					metadataReadAt: new Date(),
					originalSize: BigInt(originalSize),
					originalModifiedAt: new Date(originalModifiedAt),
					position: (stats._max.position ?? -1) + 1,
				},
			});
			return ok();
		})
		.catch((error) => {
			// Completing twice (retry, double click) is harmless.
			if (isUniqueViolation(error)) return ok();
			throw error;
		});

	if (result.ok) revalidateClientWork();
	return result;
}
