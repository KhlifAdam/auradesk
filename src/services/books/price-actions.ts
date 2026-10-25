"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { type ActionResult, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { priceListSchema } from "@/lib/books/pricing";
import { db } from "@/lib/db";

/** Saves the studio's book prices. Clients quote against them as they choose. */
export async function savePriceList(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = priceListSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const data = parsed.data as Prisma.InputJsonValue;
	await db.bookPriceList.upsert({
		where: { photographerId },
		create: { photographerId, data },
		update: { data },
	});
	revalidatePath("/dashboard/books", "layout");
	return ok();
}
