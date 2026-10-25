import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { ROLES } from "@/lib/auth/roles";
import { auth } from "@/lib/auth/server";

/**
 * Platform administrators only. Admin queries read accounts and studios,
 * never a studio's private data (clients, projects, files, money).
 * Signed-out visitors go to the admin sign-in, anyone else to the home page.
 */
export const requireAdmin = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect(ADMIN_PATHS.login);
	if (session.user.role !== ROLES.admin) redirect("/");
	return { session, adminId: session.user.id };
});
