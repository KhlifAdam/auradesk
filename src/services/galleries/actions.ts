"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendGallerySharedEmail } from "@/lib/mail/send-client-notices";
import { realEmail } from "@/lib/phone";
import { sendGallerySharedSms } from "@/lib/sms/send-client-sms";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { canClientView } from "@/services/projects/visibility";
import { lockGallery, lockPhotographer } from "@/services/shared/lock-rows";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import {
	abortUploads,
	deleteGalleryFiles,
	findUploadSessions,
} from "./cleanup";
import { GALLERIES_PER_PROJECT_LIMIT } from "./constants";
import {
	createGallerySchema,
	shareGallerySchema,
	updateGallerySchema,
} from "./schemas";

export async function createGallery(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = createGallerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { projectId, title, kind } = parsed.data;

	const result = await db.$transaction(async (tx) => {
		await lockPhotographer(tx, photographerId);
		const project = await tx.project.findFirst({
			where: { id: projectId, photographerId },
			select: { _count: { select: { galleries: true } } },
		});
		if (!project) return fail("notFound");
		const count = project._count.galleries;
		if (count >= GALLERIES_PER_PROJECT_LIMIT) return fail("galleryLimit");
		const gallery = await tx.gallery.create({
			data: { photographerId, projectId, title, kind, position: count },
			select: { id: true },
		});
		return ok(gallery);
	});

	if (result.ok) revalidateClientWork();
	return result;
}

export async function updateGallery(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateGallerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, description, selectionLimit, ...rest } = parsed.data;

	const result = await db.$transaction(async (tx) => {
		await lockGallery(tx, id);
		const gallery = await tx.gallery.findFirst({
			where: { id, photographerId },
			select: { id: true },
		});
		if (!gallery) return fail("notFound");
		if (selectionLimit !== null) {
			const picked = await tx.galleryItem.count({
				where: { galleryId: id, selected: true },
			});
			if (selectionLimit < picked) return fail("limitBelowSelection");
		}
		await tx.gallery.update({
			where: { id },
			data: {
				...rest,
				selectionLimit,
				description: emptyToNull(description),
				// No more links: the client's active one stops working at once.
				...(!rest.linkSharing && { shareToken: null }),
			},
		});
		return ok();
	});

	if (result.ok) revalidateClientWork();
	return result;
}

export async function shareGallery(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = shareGallerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, shared } = parsed.data;

	const gallery = await db.gallery.findFirst({
		where: { id, photographerId },
		select: {
			title: true,
			sharedAt: true,
			project: {
				select: {
					title: true,
					stage: true,
					paymentStatus: true,
					client: {
						select: { email: true, phoneNumber: true, locale: true },
					},
				},
			},
			photographer: {
				select: { name: true, studio: { select: { name: true } } },
			},
		},
	});
	if (!gallery) return fail("notFound");

	await db.gallery.update({
		where: { id },
		data: { sharedAt: shared ? (gallery.sharedAt ?? new Date()) : null },
	});

	// Nobody to notify before the invitation is accepted, and the link only
	// works once the project reaches the Selection step.
	const client = gallery.project.client;
	if (shared && !gallery.sharedAt && client && canClientView(gallery.project)) {
		const studio =
			gallery.photographer.studio?.name ?? gallery.photographer.name;
		const locale = resolveMailLocale(client.locale);
		// Phone-only clients have no real email: text them instead.
		const notice = realEmail(client.email)
			? sendGallerySharedEmail({
					to: client.email,
					locale,
					studio,
					gallery: gallery.title,
					project: gallery.project.title,
					galleryId: id,
				})
			: client.phoneNumber
				? sendGallerySharedSms({
						to: client.phoneNumber,
						locale,
						studio,
						gallery: gallery.title,
						galleryId: id,
					})
				: Promise.resolve();
		notice.catch((error) =>
			console.error("Failed to notify the client of a shared gallery:", error),
		);
	}

	revalidateClientWork();
	return ok();
}

/** Unlocks a submitted selection so the client can change it. */
export async function reopenSelection(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.gallery.updateMany({
		where: { id: parsed.data, photographerId },
		data: { submittedAt: null },
	});
	if (count === 0) return fail("notFound");

	revalidateClientWork();
	return ok();
}

export async function deleteGallery(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const [files, uploads] = await Promise.all([
		db.galleryItem.findMany({
			where: { galleryId: parsed.data, photographerId },
			select: { key: true, previewKey: true },
		}),
		findUploadSessions({ galleryId: parsed.data, photographerId }),
	]);
	const { count } = await db.gallery.deleteMany({
		where: { id: parsed.data, photographerId },
	});
	if (count === 0) return fail("notFound");

	await Promise.all([deleteGalleryFiles(files), abortUploads(uploads)]);
	revalidateClientWork();
	return ok();
}
