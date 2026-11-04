import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { requireUser } from "@/lib/auth/require-user";
import { ROLES } from "@/lib/auth/roles";

/**
 * Any signed-in account but an administrator may open the team space: it
 * shows invitations for their verified email and the projects they are
 * assigned to. Every team-space query MUST filter by the returned `userId`
 * (accepted memberships only).
 */
export const requireTeamUser = cache(async () => {
	const session = await requireUser();
	if (session.user.role === ROLES.admin) redirect(ADMIN_PATHS.home);
	return { session, userId: session.user.id };
});
