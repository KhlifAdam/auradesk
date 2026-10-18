"use server";

import { randomBytes } from "node:crypto";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { idSchema } from "@/services/shared/schemas";
import { clientGalleryWhere } from "./access";
import { shareLinkSchema } from "./schemas";

const DAY_MS = 24 * 60 * 60 * 1000;
/** 24 random bytes: a link nobody can guess. */
const newToken = () => randomBytes(24).toString("base64url");

/**
 * The client opens (or updates) a view-only link to one of their galleries,
 * for people without an account. An existing link keeps its address.
 */
export async function saveShareLink(
	input: unknown,
): Promise<ActionResult<{ token: string }>> {
	const { clientId } = await requireClient();
	const parsed = shareLinkSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { galleryId, downloads, expiresInDays } = parsed.data;

	const gallery = await db.gallery.findFirst({
		where: {
			id: galleryId,
			linkSharing: true,
			...clientGalleryWhere(clientId),
		},
		select: { shareToken: true },
	});
	if (!gallery) return fail("notFound");

	const token = gallery.shareToken ?? newToken();
	await db.gallery.update({
		where: { id: galleryId },
		data: {
			shareToken: token,
			shareDownloads: downloads,
			shareExpiresAt: expiresInDays
				? new Date(Date.now() + expiresInDays * DAY_MS)
				: null,
		},
	});
	revalidateClientWork();
	return ok({ token });
}

/** Stops the link: its address stops working for everyone, at once. */
export async function stopShareLink(input: unknown): Promise<ActionResult> {
	const { clientId } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.gallery.updateMany({
		where: { id: parsed.data, ...clientGalleryWhere(clientId) },
		data: { shareToken: null, shareExpiresAt: null, shareDownloads: false },
	});
	if (count === 0) return fail("notFound");

	revalidateClientWork();
	return ok();
}
