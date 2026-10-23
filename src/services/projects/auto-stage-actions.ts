"use server";

import { z } from "zod";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { revalidateClientWork } from "./revalidate";

/** Turns the automatic workflow on or off for all of the studio's projects. */
export async function setAutoAdvanceStages(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = z.boolean().safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.studio.updateMany({
		where: { photographerId },
		data: { autoAdvanceStages: parsed.data },
	});
	if (count === 0) return fail("notFound");

	revalidateClientWork();
	return ok();
}
