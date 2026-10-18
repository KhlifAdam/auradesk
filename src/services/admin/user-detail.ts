import "server-only";

import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";

export interface AdminUserDetail {
	id: string;
	name: string;
	email: string;
	phone: string;
	image: string | null;
	role: string;
	createdAt: string;
	lastActiveAt: string | null;
	banned: boolean;
	banReason: string;
	studio: {
		name: string;
		slug: string;
		published: boolean;
		createdAt: string;
	} | null;
	/** How much the account holds, as counts: never the records themselves. */
	counts: {
		clients: number;
		projects: number;
		galleries: number;
		photos: number;
		bookings: number;
		invoices: number;
	};
	storageBytes: number;
}

/** One account for the admin: who, when, and how big. No private content. */
export async function getAdminUserDetail(
	userId: string,
): Promise<AdminUserDetail | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			phoneNumber: true,
			image: true,
			role: true,
			createdAt: true,
			banned: true,
			banReason: true,
			studio: {
				select: { name: true, slug: true, published: true, createdAt: true },
			},
		},
	});
	if (!user) return null;

	const own = { photographerId: userId };
	const [
		lastSession,
		clients,
		projects,
		galleries,
		photos,
		bookings,
		invoices,
		files,
		media,
	] = await Promise.all([
		db.session.aggregate({ where: { userId }, _max: { updatedAt: true } }),
		db.clientProfile.count({ where: own }),
		db.project.count({ where: own }),
		db.gallery.count({ where: own }),
		db.galleryItem.count({ where: own }),
		db.booking.count({ where: own }),
		db.invoice.count({ where: own }),
		db.galleryItem.aggregate({ where: own, _sum: { size: true } }),
		db.media.aggregate({ where: own, _sum: { size: true } }),
	]);

	return {
		id: user.id,
		name: user.name,
		email: realEmail(user.email) ?? "",
		phone: user.phoneNumber ?? "",
		image: user.image ?? null,
		role: user.role ?? ROLES.photographer,
		createdAt: user.createdAt.toISOString(),
		lastActiveAt: lastSession._max.updatedAt?.toISOString() ?? null,
		banned: Boolean(user.banned),
		banReason: user.banReason ?? "",
		studio: user.studio && {
			...user.studio,
			createdAt: user.studio.createdAt.toISOString(),
		},
		counts: { clients, projects, galleries, photos, bookings, invoices },
		storageBytes: Number(files._sum.size ?? 0) + (media._sum.size ?? 0),
	};
}
