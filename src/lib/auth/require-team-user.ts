import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth/require-user";

/**
 * Any signed-in account may open the team space: it shows invitations for
 * their verified email and the projects they are assigned to. Every team-space
 * query MUST filter by the returned `userId` (accepted memberships only).
 */
export const requireTeamUser = cache(async () => {
	const session = await requireUser();
	return { session, userId: session.user.id };
});
