"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendSelectionSubmittedEmail } from "@/lib/mail/send-client-notices";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { lockGallery } from "@/services/shared/lock-rows";
import { idSchema } from "@/services/shared/schemas";
import { clientGalleryWhere } from "./access";
import { selectAllSchema, toggleSelectionSchema } from "./schemas";

export async function toggleSelection(
	input: unknown,
): Promise<ActionResult<{ selectedCount: number }>> {
	const { clientId } = await requireClient();
	const parsed = toggleSelectionSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { itemId, selected } = parsed.data;

	const item = await db.galleryItem.findFirst({
		where: { id: itemId, gallery: clientGalleryWhere(clientId) },
		select: { galleryId: true },
	});
	if (!item) return fail("notFound");
	const { galleryId } = item;

	// The gallery lock serializes toggles, so two tabs can't exceed the limit.
	const result = await db.$transaction(async (tx) => {
		await lockGallery(tx, galleryId);
		const gallery = await tx.gallery.findUniqueOrThrow({
			where: { id: galleryId },
			select: {
				selectionEnabled: true,
				selectionLimit: true,
				submittedAt: true,
			},
		});
		if (!gallery.selectionEnabled || gallery.submittedAt)
			return fail("selectionLocked");

		const picked = await tx.galleryItem.count({
			where: { galleryId, selected: true },
		});
		const limit = gallery.selectionLimit;
		if (selected && limit !== null && picked >= limit)
			return fail("selectionLimitReached");

		const { count } = await tx.galleryItem.updateMany({
			where: { id: itemId, selected: !selected },
			data: { selected },
		});
		return ok({ selectedCount: picked + (selected ? count : -count) });
	});

	if (result.ok) revalidateClientWork();
	return result;
}

/** Locks the selection and tells the photographer. */
export async function submitSelection(input: unknown): Promise<ActionResult> {
	const { clientId, session } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const galleryId = parsed.data;

	const result = await db.$transaction(async (tx) => {
		await lockGallery(tx, galleryId);
		const gallery = await tx.gallery.findFirst({
			where: { id: galleryId, ...clientGalleryWhere(clientId) },
			select: {
				title: true,
				selectionEnabled: true,
				selectionLimit: true,
				submittedAt: true,
				project: { select: { id: true, title: true } },
				photographer: { select: { email: true, locale: true } },
			},
		});
		if (!gallery) return fail("notFound");
		if (!gallery.selectionEnabled || gallery.submittedAt)
			return fail("selectionLocked");

		const count = await tx.galleryItem.count({
			where: { galleryId, selected: true },
		});
		if (count === 0) return fail("selectionEmpty");
		if (gallery.selectionLimit !== null && count > gallery.selectionLimit)
			return fail("selectionLimitReached");

		await tx.gallery.update({
			where: { id: galleryId },
			data: { submittedAt: new Date() },
		});
		return ok({ ...gallery, count });
	});
	if (!result.ok) return result;

	const { photographer, project, title, count } = result.data;
	sendSelectionSubmittedEmail({
		to: photographer.email,
		locale: resolveMailLocale(photographer.locale),
		client: session.user.name,
		gallery: title,
		project: project.title,
		count,
		projectId: project.id,
		galleryId,
	}).catch((error) =>
		console.error("Failed to send selection submitted email:", error),
	);

	revalidateClientWork();
	return ok();
}

/**
 * Picks (or unpicks) every photo of the gallery, on all its pages. Refused
 * when the gallery has more photos than the photographer's limit allows.
 */
export async function selectAllInGallery(
	input: unknown,
): Promise<ActionResult<{ selectedCount: number }>> {
	const { clientId } = await requireClient();
	const parsed = selectAllSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, selected } = parsed.data;

	const result = await db.$transaction(async (tx) => {
		await lockGallery(tx, galleryId);
		const gallery = await tx.gallery.findFirst({
			where: { id: galleryId, ...clientGalleryWhere(clientId) },
			select: {
				selectionEnabled: true,
				selectionLimit: true,
				submittedAt: true,
				_count: { select: { items: true } },
			},
		});
		if (!gallery) return fail("notFound");
		if (!gallery.selectionEnabled || gallery.submittedAt)
			return fail("selectionLocked");
		const total = gallery._count.items;
		if (
			selected &&
			gallery.selectionLimit !== null &&
			total > gallery.selectionLimit
		)
			return fail("selectionLimitReached");

		await tx.galleryItem.updateMany({
			where: { galleryId, selected: !selected },
			data: { selected },
		});
		return ok({ selectedCount: selected ? total : 0 });
	});

	if (result.ok) revalidateClientWork();
	return result;
}
