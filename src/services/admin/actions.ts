"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ROLES } from "@/lib/auth/roles";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { revalidatePublicSites } from "@/lib/public-site/cache";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { logAdminAction } from "./audit";
import { banSchema } from "./schemas";

/** Only other, non-admin accounts can be suspended. */
async function assertBannable(adminId: string, userId: string) {
	if (userId === adminId) return "cannotBanSelf";
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});
	if (!user) return "notFound";
	return user.role === ROLES.admin ? "cannotBanAdmin" : null;
}

/** Suspends an account: it's signed out everywhere and can't sign in. */
export async function banAccount(input: unknown): Promise<ActionResult> {
	const { adminId, session } = await requireAdmin();
	const parsed = banSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { userId, reason } = parsed.data;
	const blocked = await assertBannable(adminId, userId);
	if (blocked) return fail(blocked);

	await auth.api.banUser({
		body: { userId, banReason: emptyToNull(reason) ?? undefined },
		headers: await headers(),
	});
	await logAdminAction(session.user, "BAN", userId, reason);
	// Their site goes offline (and comes back on unban) straight away.
	revalidatePublicSites();
	revalidatePath("/admin", "layout");
	return ok();
}

export async function unbanAccount(input: unknown): Promise<ActionResult> {
	const { session } = await requireAdmin();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	await auth.api.unbanUser({
		body: { userId: parsed.data },
		headers: await headers(),
	});
	await logAdminAction(session.user, "UNBAN", parsed.data);
	revalidatePublicSites();
	revalidatePath("/admin", "layout");
	return ok();
}
