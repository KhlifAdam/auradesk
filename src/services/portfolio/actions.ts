"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { lockPhotographer } from "@/services/shared/lock-rows";
import { pageSkip } from "@/services/shared/pagination";
import {
	pageReorderSchema,
	planPageReorder,
} from "@/services/shared/reorder-page";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { revalidateAlbum } from "./helpers";
import {
	ALBUM_PAGE_SIZE,
	albumPublishedSchema,
	albumSchema,
	MAX_ALBUMS,
	updateAlbumSchema,
} from "./schemas";

export async function createAlbum(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = albumSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	try {
		const album = await db.$transaction(async (tx) => {
			await lockPhotographer(tx, photographerId);
			if ((await tx.album.count({ where: { photographerId } })) >= MAX_ALBUMS)
				return null;

			const { _max } = await tx.album.aggregate({
				where: { photographerId },
				_max: { position: true },
			});
			return tx.album.create({
				data: {
					...parsed.data,
					description: emptyToNull(parsed.data.description),
					photographerId,
					position: (_max.position ?? -1) + 1,
				},
			});
		});
		if (!album) return fail("albumLimit");

		revalidateAlbum();
		return ok({ id: album.id });
	} catch (error) {
		if (isUniqueViolation(error)) return fail("albumSlugTaken");
		throw error;
	}
}

export async function updateAlbum(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateAlbumSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, description, ...data } = parsed.data;
	try {
		const { count } = await db.album.updateMany({
			where: { id, photographerId },
			data: { ...data, description: emptyToNull(description) },
		});
		if (count === 0) return fail("notFound");
	} catch (error) {
		if (isUniqueViolation(error)) return fail("albumSlugTaken");
		throw error;
	}
	revalidateAlbum(id);
	return ok();
}

/** Shows or hides an album on the public site. */
export async function setAlbumPublished(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = albumPublishedSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, published } = parsed.data;
	const { count } = await db.album.updateMany({
		where: { id, photographerId },
		data: { published },
	});
	if (count === 0) return fail("notFound");
	revalidateAlbum(id);
	return ok();
}

export async function deleteAlbum(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const id = idSchema.parse(input);
	// Media stays in the library; only the album and its item links go.
	const { count } = await db.album.deleteMany({
		where: { id, photographerId },
	});
	if (count === 0) return fail("notFound");
	revalidateAlbum();
	return ok();
}

export async function reorderAlbums(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = pageReorderSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { page, ids } = parsed.data;

	const reordered = await db.$transaction(async (tx) => {
		await lockPhotographer(tx, photographerId);
		const current = await tx.album.findMany({
			where: { photographerId },
			orderBy: [{ position: "asc" }, { id: "asc" }],
			skip: pageSkip(page, ALBUM_PAGE_SIZE),
			take: ALBUM_PAGE_SIZE,
			select: { id: true, position: true },
		});
		const next = planPageReorder(current, ids);
		if (!next) return false;
		for (const { id, position } of next) {
			await tx.album.update({ where: { id }, data: { position } });
		}
		return true;
	});
	if (!reordered) return fail("staleOrder");

	revalidateAlbum();
	return ok();
}
