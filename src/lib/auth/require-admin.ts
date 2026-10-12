import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { ROLES } from "@/lib/auth/roles";

/**
 * Platform administrators only. Admin queries read accounts and studios,
 * never a studio's private data (clients, projects, files, money).
 */
export const requireAdmin = cache(async () => {
	const session = await requireUser();
	if (session.user.role !== ROLES.admin) redirect("/");
	return { session, adminId: session.user.id };
});
