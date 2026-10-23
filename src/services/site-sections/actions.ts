"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { revalidatePublicSites } from "@/lib/public-site/cache";
import { ownsMedia } from "@/services/shared/assert-owned-media";
import { normalizeDraftSections, sectionMediaIds } from "./normalize";
import { saveSectionsSchema } from "./schemas";

/** Saves the order, visibility and content of every public-site section. */
export async function saveSiteSections(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = saveSectionsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { sections } = parsed.data;

	// Logos, photos and videos must come from the photographer's own library.
	if (!(await ownsMedia(photographerId, sectionMediaIds(sections))))
		return fail("invalidInput");

	const { count } = await db.studio.updateMany({
		where: { photographerId },
		data: { sections, sectionsDraft: Prisma.DbNull },
	});
	if (count === 0) return fail("notFound");

	revalidatePublicSites();
	revalidatePath("/dashboard/site/appearance");
	return ok();
}

/**
 * Stores the sections being edited so the live preview can show them before
 * they are saved. Visitors never see a draft. Unfinished parts are left out
 * rather than refused, and media is only ever looked up in the
 * photographer's own library when the preview renders.
 */
export async function draftSiteSections(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const sections = normalizeDraftSections(input);

	const { count } = await db.studio.updateMany({
		where: { photographerId },
		data: { sectionsDraft: sections },
	});
	return count === 0 ? fail("notFound") : ok();
}
