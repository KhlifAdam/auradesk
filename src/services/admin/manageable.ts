import "server-only";

import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";

type Refusal =
	| "cannotManageSelf"
	| "notFound"
	| "cannotManageAdmin"
	| "accountDeleted";

/**
 * The account an admin wants to edit, re-role or delete: never their own,
 * never another admin (the admin role is handled on the command line), and
 * not one that is already deleted.
 */
export async function findManageable(adminId: string, userId: string) {
	const refuse = (error: Refusal) => ({ error }) as const;
	if (userId === adminId) return refuse("cannotManageSelf");
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			role: true,
			email: true,
			phoneNumber: true,
			image: true,
			deletedAt: true,
		},
	});
	if (!user) return refuse("notFound");
	if (user.role === ROLES.admin) return refuse("cannotManageAdmin");
	if (user.deletedAt) return refuse("accountDeleted");
	return { user } as const;
}
