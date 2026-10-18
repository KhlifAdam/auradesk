"use server";

import { randomUUID } from "node:crypto";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
	abortPrivateMultipart,
	completePrivateMultipart,
	getPrivateUploadUrl,
	headPrivateObject,
	listPrivateParts,
	signPrivatePart,
	startPrivateMultipart,
} from "@/lib/storage/r2-private";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockGallery } from "@/services/shared/lock-rows";
import { idSchema } from "@/services/shared/schemas";
import {
	GALLERY_EXTENSION_BY_MIME,
	GALLERY_ITEMS_LIMIT,
	galleryKeyPrefix,
	isGalleryVideo,
	PREVIEW_MIME_TYPE,
	partCount,
	partSizeFor,
	previewKeyFor,
} from "./constants";
import {
	completeUploadSchema,
	signPartsSchema,
	startUploadSchema,
} from "./schemas";

const ownSession = (photographerId: string, id: string) =>
	db.uploadSession.findFirst({ where: { id, photographerId } });

/** The parts already stored, or null when the bucket no longer has the upload. */
const storedParts = (key: string, uploadId: string) =>
	listPrivateParts(key, uploadId).catch(() => null);

/**
 * Opens the upload of one file, or resumes it when the same file (same name,
 * size and date) was started before: the parts already stored are skipped.
 */
export async function startGalleryUpload(input: unknown): Promise<
	ActionResult<{
		sessionId: string;
		partSize: number;
		totalParts: number;
		doneParts: number[];
		previewUploadUrl: string | null;
		/** The studio removes GPS positions from originals before they leave. */
		stripLocation: boolean;
	}>
> {
	const { photographerId } = await requirePhotographer();
	const parsed = startUploadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, filename, mimeType, size, fingerprint, previewSize } =
		parsed.data;

	const gallery = await db.gallery.findFirst({
		where: { id: galleryId, photographerId },
		select: {
			_count: { select: { items: true } },
			photographer: {
				select: { studio: { select: { stripGalleryLocation: true } } },
			},
		},
	});
	if (!gallery) return fail("notFound");
	if (gallery._count.items >= GALLERY_ITEMS_LIMIT) return fail("galleryFull");

	let session = await db.uploadSession.findUnique({
		where: { galleryId_fingerprint: { galleryId, fingerprint } },
	});
	let done: number[] = [];
	if (session) {
		const parts = await storedParts(session.key, session.uploadId);
		if (parts && Number(session.size) === size) {
			done = parts.map((part) => part.partNumber);
		} else {
			// The bucket dropped it (or the file changed): start over.
			await db.uploadSession.delete({ where: { id: session.id } });
			session = null;
		}
	}

	if (!session) {
		const base = `${galleryKeyPrefix(photographerId, galleryId)}${randomUUID()}`;
		const key = `${base}.${GALLERY_EXTENSION_BY_MIME[mimeType]}`;
		const uploadId = await startPrivateMultipart(key, mimeType);
		try {
			session = await db.uploadSession.create({
				data: {
					photographerId,
					galleryId,
					key,
					uploadId,
					filename,
					mimeType,
					size: BigInt(size),
					partSize: partSizeFor(size),
					fingerprint,
				},
			});
		} catch (error) {
			// The same file started twice at once: keep the first one.
			await abortPrivateMultipart(key, uploadId).catch(() => {});
			if (isUniqueViolation(error)) return fail("uploadInProgress");
			throw error;
		}
	}

	const previewUploadUrl = previewSize
		? await getPrivateUploadUrl(
				previewKeyFor(session.key),
				PREVIEW_MIME_TYPE,
				previewSize,
			)
		: null;

	return ok({
		sessionId: session.id,
		partSize: session.partSize,
		totalParts: partCount(size, session.partSize),
		doneParts: done,
		previewUploadUrl,
		stripLocation: Boolean(gallery.photographer.studio?.stripGalleryLocation),
	});
}

/** Presigned URLs for some parts of an open upload. */
export async function signUploadParts(
	input: unknown,
): Promise<ActionResult<{ partNumber: number; url: string }[]>> {
	const { photographerId } = await requirePhotographer();
	const parsed = signPartsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const session = await ownSession(photographerId, parsed.data.sessionId);
	if (!session) return fail("uploadMissing");

	const total = partCount(Number(session.size), session.partSize);
	if (parsed.data.partNumbers.some((n) => n > total))
		return fail("invalidInput");

	const urls = await Promise.all(
		parsed.data.partNumbers.map(async (partNumber) => ({
			partNumber,
			url: await signPrivatePart(session.key, session.uploadId, partNumber),
		})),
	);
	return ok(urls);
}

/**
 * Assembles the parts, checks the result and adds the file to the gallery.
 * Every part must be there: the server reads them from the bucket itself.
 */
export async function completeGalleryUpload(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = completeUploadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { sessionId, previewSize, ...meta } = parsed.data;
	const session = await ownSession(photographerId, sessionId);
	if (!session) return fail("uploadMissing");

	const size = Number(session.size);
	const total = partCount(size, session.partSize);
	const parts = await storedParts(session.key, session.uploadId);
	if (parts) {
		const complete =
			parts.length === total &&
			parts.every((part, index) => part.partNumber === index + 1) &&
			parts.reduce((sum, part) => sum + part.size, 0) === size;
		if (!complete) return fail("uploadIncomplete");
		await completePrivateMultipart(session.key, session.uploadId, parts);
	}
	// No parts left means a previous try already assembled the file: the size
	// check below tells whether that really happened.
	const stored = await headPrivateObject(session.key);
	if (stored?.size !== size) return fail("uploadMissing");

	// The preview is a nice-to-have: without it the grid shows an icon.
	const previewKey = previewKeyFor(session.key);
	const preview = previewSize ? await headPrivateObject(previewKey) : null;

	const result = await db.$transaction(async (tx) => {
		await lockGallery(tx, session.galleryId);
		const stats = await tx.galleryItem.aggregate({
			where: { galleryId: session.galleryId },
			_max: { position: true },
			_count: true,
		});
		if (stats._count >= GALLERY_ITEMS_LIMIT) return fail("galleryFull");
		await tx.galleryItem.create({
			data: {
				galleryId: session.galleryId,
				photographerId,
				key: session.key,
				previewKey: preview?.size === previewSize ? previewKey : null,
				filename: session.filename,
				mimeType: session.mimeType,
				size: session.size,
				type: isGalleryVideo(session.mimeType) ? "VIDEO" : "IMAGE",
				...meta,
				position: (stats._max.position ?? -1) + 1,
			},
		});
		await tx.uploadSession.delete({ where: { id: session.id } });
		return ok();
	});

	if (result.ok) revalidateClientWork();
	return result;
}

/** Stops an upload for good and frees what was already stored. */
export async function abortGalleryUpload(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const session = await ownSession(photographerId, parsed.data);
	if (!session) return ok();

	await abortPrivateMultipart(session.key, session.uploadId).catch((error) =>
		console.error("Failed to abort a multipart upload:", error),
	);
	await db.uploadSession.deleteMany({ where: { id: session.id } });
	revalidateClientWork();
	return ok();
}
