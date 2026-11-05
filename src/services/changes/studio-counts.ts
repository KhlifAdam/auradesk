import "server-only";

import { db } from "@/lib/db";
import { studioUnseenBooking, studioUnseenProject } from "./unseen";

/** The studio's nav badges: what clients sent or changed that it hasn't opened. */
export async function countStudioNav(photographerId: string) {
	const [bookings, projects] = await Promise.all([
		db.booking.count({ where: { photographerId, ...studioUnseenBooking() } }),
		db.project.count({ where: { photographerId, ...studioUnseenProject() } }),
	]);
	return { bookings, projects };
}
