import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { requireUser } from "@/lib/auth/require-user";
import { ROLES } from "@/lib/auth/roles";

/**
 * Resolves the current photographer for private-space queries and actions.
 * Every tenant-scoped Prisma query MUST filter by the returned `photographerId`.
 * Cached per request so pages and nested components share one session lookup.
 */
export const requirePhotographer = cache(async () => {
	const session = await requireUser();
	const { role } = session.user;

	// Clients stay in their own portal; they cannot become photographers.
	if (role === ROLES.client) redirect(AUTH_PATHS.client.home);
	// Collaborators work from their own space.
	if (role === ROLES.team) redirect("/team");
	if (role === ROLES.admin) redirect("/admin");
	if (role !== ROLES.photographer) redirect("/");

	return { session, photographerId: session.user.id };
});
