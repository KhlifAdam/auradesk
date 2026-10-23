"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import {
	EXIF_HEAD_BYTES,
	readImageCapture,
	readVideoCapture,
} from "@/lib/media/read-capture-info";
import {
	getPrivateViewUrl,
	readPrivateObjectHead,
} from "@/lib/storage/r2-private";
import { advanceForGallery } from "@/services/projects/auto-stage";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockGallery } from "@/services/shared/lock-rows";
import { idSchema } from "@/services/shared/schemas";
import {
	extensionOf,
	METADATA_BATCH,
	organizedName,
	organizeSchema,
	prefixSchema,
} from "./organize";

async function captureOf(item: { key: string; type: "IMAGE" | "VIDEO" }) {
	if (item.type === "VIDEO")
		return readVideoCapture(await getPrivateViewUrl(item.key));
	return readImageCapture(
		await readPrivateObjectHead(item.key, EXIF_HEAD_BYTES),
	);
}

/**
 * Reads when and with which device the next few files were taken. A file
 * without metadata is still marked as read; its upload time stands in.
 */
export async function readGalleryMetadata(
	input: unknown,
): Promise<ActionResult<{ remaining: number }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const pending = {
		galleryId: parsed.data,
		photographerId,
		metadataReadAt: null,
	};
	const batch = await db.galleryItem.findMany({
		where: pending,
		select: { id: true, key: true, type: true },
		orderBy: [{ position: "asc" }, { id: "asc" }],
		take: METADATA_BATCH,
	});

	await Promise.all(
		batch.map(async (item) => {
			const info = await captureOf(item).catch((error) => {
				console.error(`Metadata read failed for ${item.id}:`, error);
				return { capturedAt: null, camera: null };
			});
			await db.galleryItem.update({
				where: { id: item.id },
				data: { ...info, metadataReadAt: new Date() },
			});
		}),
	);

	return ok({ remaining: await db.galleryItem.count({ where: pending }) });
}

/**
 * Puts the gallery in shooting order and/or renames every file after the
 * pattern `prefix_YYYYMMDD_0001.ext`. The first rename keeps each original
 * name, so it can be restored.
 */
export async function organizeGallery(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = organizeSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { galleryId, sort, rename } = parsed.data;
	const prefix = rename ? prefixSchema.safeParse(parsed.data.prefix) : null;
	if (prefix && !prefix.success) return failFromZod(prefix.error);

	const error = await db.$transaction(async (tx) => {
		const gallery = await tx.gallery.findFirst({
			where: { id: galleryId, photographerId },
			select: { id: true },
		});
		if (!gallery) return "notFound";
		await lockGallery(tx, galleryId);

		const items = await tx.galleryItem.findMany({
			where: { galleryId },
			select: {
				id: true,
				position: true,
				filename: true,
				originalFilename: true,
				capturedAt: true,
				createdAt: true,
				metadataReadAt: true,
			},
			orderBy: [{ position: "asc" }, { id: "asc" }],
		});
		if (items.some((item) => !item.metadataReadAt)) return "metadataPending";

		const takenAt = (item: (typeof items)[number]) =>
			item.capturedAt ?? item.createdAt;
		const ordered = [...items].sort(
			(a, b) => takenAt(a).getTime() - takenAt(b).getTime(),
		);
		const rows = ordered.map((item, index) => {
			const original = item.originalFilename ?? item.filename;
			return {
				id: item.id,
				position: sort ? index : item.position,
				filename: prefix?.success
					? organizedName(
							prefix.data,
							takenAt(item),
							index,
							extensionOf(original),
						)
					: item.filename,
				original: prefix?.success ? original : item.originalFilename,
			};
		});
		// One statement for the whole gallery (up to 2,000 files).
		await tx.$executeRaw`
			UPDATE gallery_items AS g
			SET position = v.position, filename = v.filename, original_filename = v.original
			FROM unnest(
				${rows.map((r) => r.id)}::text[],
				${rows.map((r) => r.position)}::int[],
				${rows.map((r) => r.filename)}::text[],
				${rows.map((r) => r.original)}::text[]
			) AS v(id, position, filename, original)
			WHERE g.id = v.id AND g.gallery_id = ${galleryId}`;
		return null;
	});
	if (error) return fail(error);

	await advanceForGallery(galleryId, "organized");
	revalidateClientWork();
	return ok();
}

/** Gives every renamed file back the name it was uploaded with. */
export async function restoreOriginalNames(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const items = await db.galleryItem.findMany({
		where: {
			galleryId: parsed.data,
			photographerId,
			originalFilename: { not: null },
		},
		select: { id: true, originalFilename: true },
	});
	if (items.length === 0) return fail("notFound");
	await db.$transaction(
		items.map((item) =>
			db.galleryItem.update({
				where: { id: item.id },
				data: {
					filename: item.originalFilename ?? undefined,
					originalFilename: null,
				},
			}),
		),
	);

	revalidateClientWork();
	return ok();
}
