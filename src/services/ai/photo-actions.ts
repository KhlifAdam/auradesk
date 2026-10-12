"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { checkEyesClosed } from "@/lib/ai/eyes-check";
import { measurePhoto } from "@/lib/ai/photo-metrics";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { readPrivateObject } from "@/lib/storage/r2-private";
import { idSchema } from "@/services/shared/schemas";
import { ANALYSIS_BATCH } from "./options";
import { markDuplicates, qualityFlags } from "./photo-flags";

async function readBytes(key: string) {
	const stream = await readPrivateObject(key);
	return Buffer.from(await new Response(stream).arrayBuffer());
}

/**
 * Analyses the next few photos of a gallery that haven't been analysed yet,
 * then refreshes its duplicate groups. The client calls it again while
 * `remaining` is above zero, which shows progress and avoids long requests.
 */
export async function analyzeGalleryBatch(
	input: unknown,
): Promise<ActionResult<{ analysed: number; remaining: number }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const galleryId = parsed.data;
	const owned = await db.gallery.count({
		where: { id: galleryId, photographerId },
	});
	if (!owned) return fail("notFound");

	const pending = { galleryId, type: "IMAGE" as const, analysis: null };
	const batch = await db.galleryItem.findMany({
		where: pending,
		select: { id: true, key: true, previewKey: true },
		orderBy: [{ position: "asc" }, { id: "asc" }],
		take: ANALYSIS_BATCH,
	});

	let analysed = 0;
	for (const item of batch) {
		try {
			// The preview is small and already a JPEG: plenty for these checks.
			const image = await readBytes(item.previewKey ?? item.key);
			const [metrics, eyesClosed] = await Promise.all([
				measurePhoto(image),
				checkEyesClosed(image),
			]);
			await db.photoAnalysis.upsert({
				where: { itemId: item.id },
				create: {
					itemId: item.id,
					galleryId,
					...metrics,
					eyesClosed,
					flags: qualityFlags(metrics, eyesClosed),
				},
				update: {},
			});
			analysed++;
		} catch (error) {
			console.error(`Photo analysis failed for ${item.id}:`, error);
		}
	}
	// Nothing went through: storage or the files are unreadable, so stop
	// instead of retrying the same photos forever.
	if (batch.length > 0 && analysed === 0) return fail("analysisFailed");

	const rows = await db.photoAnalysis.findMany({
		where: { galleryId },
		select: { id: true, hash: true, sharpness: true, flags: true },
	});
	await db.$transaction(
		markDuplicates(rows).map(({ id, flags }) =>
			db.photoAnalysis.update({ where: { id }, data: { flags } }),
		),
	);

	const remaining = await db.galleryItem.count({ where: pending });
	revalidatePath("/dashboard", "layout");
	return ok({ analysed, remaining });
}

/** Forgets the analysis of a gallery, so it can be run again from scratch. */
export async function resetGalleryAnalysis(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.photoAnalysis.deleteMany({
		where: { galleryId: parsed.data, item: { photographerId } },
	});
	if (count === 0) return fail("notFound");

	revalidatePath("/dashboard", "layout");
	return ok();
}
