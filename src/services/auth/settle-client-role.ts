import "server-only";

import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";

/**
 * New accounts are photographers unless they sign up from the client side.
 * Someone who signed up elsewhere, never opened a studio, and then joins a
 * project as a client is a client: their role follows. A photographer with
 * any studio activity keeps theirs (they can be a client of another studio).
 */
export async function settleClientRole(userId: string) {
	const [user, studio, projects, bookings, media] = await Promise.all([
		db.user.findUnique({ where: { id: userId }, select: { role: true } }),
		db.studio.count({ where: { photographerId: userId } }),
		db.project.count({ where: { photographerId: userId } }),
		db.booking.count({ where: { photographerId: userId } }),
		db.media.count({ where: { photographerId: userId } }),
	]);
	if (user?.role !== ROLES.photographer) return;
	if (studio + projects + bookings + media > 0) return;

	await db.user.update({
		where: { id: userId },
		data: { role: ROLES.client },
	});
}
