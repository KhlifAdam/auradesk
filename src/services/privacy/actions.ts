"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { requireUser } from "@/lib/auth/require-user";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { revalidatePublicSites } from "@/lib/public-site/cache";
import { collectAccountFiles, deleteAccountFiles } from "./purge";
import { privacySettingsSchema } from "./schemas";

const PRIVACY_PATH = "/dashboard/privacy";

export async function updatePrivacySettings(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = privacySettingsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { retention, stripLocation } = parsed.data;
	const { count } = await db.studio.updateMany({
		where: { photographerId },
		data: {
			galleryRetentionMonths: retention ? Number(retention) : null,
			stripGalleryLocation: stripLocation,
		},
	});
	if (count === 0) return fail("notFound");

	revalidatePath(PRIVACY_PATH);
	return ok();
}

/**
 * Right to erasure: the account and everything it owns. A studio takes its
 * site, clients' records, projects and files with it. A client's bookings,
 * projects and invoices stay with their photographers (who must keep
 * invoices), unlinked from the deleted account. Admins can't delete
 * themselves here: the platform must keep one.
 */
export async function deleteMyAccount(): Promise<ActionResult> {
	const { user } = await requireUser();
	if (user.role === ROLES.admin) return fail("forbidden");

	const files = await collectAccountFiles(user.id);
	await db.user.delete({ where: { id: user.id } });
	await deleteAccountFiles(files);

	if (user.role === ROLES.photographer) revalidatePublicSites();
	return ok();
}
