"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { classifyClip } from "@/lib/ai/video-classify";
import { grabFrames, measureVideo } from "@/lib/ai/video-metrics";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { getPrivateViewUrl } from "@/lib/storage/r2-private";
import { idSchema } from "@/services/shared/schemas";

/** Where the stills shown to the vision model are taken, as shares of the clip. */
const STILL_POSITIONS = [0.15, 0.5, 0.85];

/**
 * Analyses the next video of a gallery that hasn't been analysed yet. ffmpeg
 * reads it straight from storage through a short-lived link, at low
 * resolution. The client calls again while `remaining` is above zero.
 */
export async function analyzeNextVideo(
	input: unknown,
): Promise<ActionResult<{ remaining: number }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const galleryId = parsed.data;
	const pending = {
		galleryId,
		photographerId,
		type: "VIDEO" as const,
		videoAnalysis: null,
	};
	const item = await db.galleryItem.findFirst({
		where: pending,
		select: { id: true, key: true },
		orderBy: [{ position: "asc" }, { id: "asc" }],
	});
	if (!item) {
		const owned = await db.gallery.count({
			where: { id: galleryId, photographerId },
		});
		return owned ? ok({ remaining: 0 }) : fail("notFound");
	}

	try {
		const url = await getPrivateViewUrl(item.key);
		const metrics = await measureVideo(url);
		const frames = await grabFrames(
			url,
			STILL_POSITIONS.map((share) => share * metrics.durationSec),
		).catch(() => []);
		const label = await classifyClip(
			frames,
			(await getLocale()) === "fr" ? "fr" : "en",
		);
		await db.videoAnalysis.upsert({
			where: { itemId: item.id },
			create: {
				itemId: item.id,
				galleryId,
				...metrics,
				silences: metrics.silences.map((s) => ({ ...s })),
				category: label?.category ?? null,
				summary: label?.summary ?? null,
			},
			update: {},
		});
	} catch (error) {
		console.error(`Video analysis failed for ${item.id}:`, error);
		return fail("analysisFailed");
	}

	revalidatePath("/dashboard", "layout");
	return ok({ remaining: await db.galleryItem.count({ where: pending }) });
}

/** Forgets the video analyses of a gallery, so they can be run again. */
export async function resetVideoAnalysis(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.videoAnalysis.deleteMany({
		where: { galleryId: parsed.data, item: { photographerId } },
	});
	if (count === 0) return fail("notFound");

	revalidatePath("/dashboard", "layout");
	return ok();
}
