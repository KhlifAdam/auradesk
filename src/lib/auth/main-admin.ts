import "server-only";

import { env } from "@/lib/env";

/**
 * The platform's main administrator (`ADMIN_EMAIL`). Nobody signs up with this
 * address from the public pages, and the command line refuses to take its
 * admin role away: the account is created and reset with `pnpm admin:create`.
 */
export function isMainAdminEmail(email: string | null | undefined) {
	return Boolean(
		env.ADMIN_EMAIL &&
			email &&
			email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase(),
	);
}
