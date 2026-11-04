import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { ROLES } from "@/lib/auth/roles";
import { auth } from "@/lib/auth/server";

/**
 * Any signed-in account but an administrator may use the client portal
 * (photographers can be clients of other studios); admins only have the admin
 * space. Every portal query MUST filter by `clientId`.
 */
export const requireClient = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect(AUTH_PATHS.client.login);
	if (session.user.role === ROLES.admin) redirect(ADMIN_PATHS.home);
	return { session, clientId: session.user.id };
});
