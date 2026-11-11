import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { ROLES } from "@/lib/auth/roles";
import { auth } from "@/lib/auth/server";

/**
 * Only client accounts use the client portal: a photographer is never a
 * client, and admins only have the admin space. Every portal query MUST
 * filter by `clientId`.
 */
export const requireClient = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect(AUTH_PATHS.client.login);
	if (session.user.role === ROLES.admin) redirect(ADMIN_PATHS.home);
	if (session.user.role === ROLES.photographer)
		redirect(AUTH_PATHS.photographer.home);
	return { session, clientId: session.user.id };
});
