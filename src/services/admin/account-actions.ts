"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { isMainAdminEmail } from "@/lib/auth/main-admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { deletedEmail, phoneEmail, toE164 } from "@/lib/phone";
import { revalidatePublicSites } from "@/lib/public-site/cache";
import { deleteObjects } from "@/lib/storage/r2";
import { ownAvatarKey } from "@/services/account/avatar-key";
import { emptyToNull } from "@/services/shared/schemas";
import { logAdminAction } from "./audit";
import { findManageable } from "./manageable";
import {
	deleteAccountSchema,
	setRoleSchema,
	updateAccountSchema,
} from "./schemas";

/** Language-neutral name left on a deleted account, wherever others still see it. */
const DELETED_NAME = "—";

function done() {
	revalidatePath("/admin", "layout");
	return ok();
}

/** Corrects an account's name, email or phone number. */
export async function updateAccount(input: unknown): Promise<ActionResult> {
	const { adminId, session } = await requireAdmin();
	const parsed = updateAccountSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { userId, values } = parsed.data;
	const found = await findManageable(adminId, userId);
	if ("error" in found) return fail(found.error);
	const { user } = found;

	const phone = values.phone ? toE164(values.phone) : null;
	// Phone-only accounts keep a placeholder address (Better Auth needs one).
	const email = values.email
		? values.email.toLowerCase()
		: phoneEmail(phone ?? "");
	if (isMainAdminEmail(email)) return fail("forbidden");

	const taken = await db.user.findFirst({
		where: {
			id: { not: userId },
			OR: [{ email }, ...(phone ? [{ phoneNumber: phone }] : [])],
		},
		select: { email: true },
	});
	if (taken) return fail(taken.email === email ? "emailTaken" : "phoneTaken");

	await db.user.update({
		where: { id: userId },
		data: {
			name: values.name,
			email,
			phoneNumber: phone,
			// A new address or number is checked again at the next sign-in.
			...(email !== user.email && { emailVerified: false }),
			...(phone !== user.phoneNumber && {
				phoneNumberVerified: phone ? false : null,
			}),
		},
	});
	await logAdminAction(session.user, "ACCOUNT_UPDATED", userId);
	revalidatePublicSites();
	return done();
}

/** Moves an account between photographer, client and team member. */
export async function setUserRole(input: unknown): Promise<ActionResult> {
	const { adminId, session } = await requireAdmin();
	const parsed = setRoleSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { userId, role } = parsed.data;
	const found = await findManageable(adminId, userId);
	if ("error" in found) return fail(found.error);
	if ((found.user.role ?? ROLES.photographer) === role) return ok();

	await db.$transaction([
		db.user.update({ where: { id: userId }, data: { role } }),
		// A studio whose owner is no longer a photographer goes offline.
		...(role !== ROLES.photographer
			? [
					db.studio.updateMany({
						where: { photographerId: userId },
						data: { published: false },
					}),
				]
			: []),
		// Signed out everywhere, so the next session carries the new role.
		db.session.deleteMany({ where: { userId } }),
	]);
	await logAdminAction(session.user, "ROLE_CHANGED", userId);
	revalidatePublicSites();
	return done();
}

/**
 * Soft delete: the account is anonymised, signed out and can never sign in
 * again (its passwords and Google links are removed), and its site goes
 * offline. Projects, invoices and messages others share with it are kept.
 */
export async function deleteAccount(input: unknown): Promise<ActionResult> {
	const { adminId, session } = await requireAdmin();
	const parsed = deleteAccountSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { userId, reason } = parsed.data;
	const found = await findManageable(adminId, userId);
	if ("error" in found) return fail(found.error);

	// Logged first, so the journal keeps who the account was.
	await logAdminAction(session.user, "ACCOUNT_DELETED", userId, reason);
	await db.$transaction([
		db.user.update({
			where: { id: userId },
			data: {
				name: DELETED_NAME,
				email: deletedEmail(userId),
				emailVerified: false,
				phoneNumber: null,
				phoneNumberVerified: null,
				image: null,
				banned: true,
				banReason: emptyToNull(reason),
				banExpires: null,
				deletedAt: new Date(),
			},
		}),
		db.session.deleteMany({ where: { userId } }),
		db.account.deleteMany({ where: { userId } }),
		db.studio.updateMany({
			where: { photographerId: userId },
			data: { published: false, bookingEnabled: false },
		}),
	]);
	const avatar = ownAvatarKey(userId, found.user.image);
	if (avatar) await deleteObjects([avatar]).catch(() => {});

	revalidatePublicSites();
	return done();
}
