import "server-only";

import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";

// Right of access and portability: what the platform holds about an account,
// as JSON. Never passwords, sessions or tokens (they live in other tables),
// nor a photographer's private notes on a client.

const profileOf = (userId: string) =>
	db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			phoneNumber: true,
			phoneNumberVerified: true,
			image: true,
			role: true,
			locale: true,
			createdAt: true,
			updatedAt: true,
		},
	});

const conversationsOf = (
	where: { photographerId: string } | { clientId: string },
) =>
	db.conversation.findMany({
		where,
		select: {
			id: true,
			createdAt: true,
			messages: {
				select: { senderId: true, body: true, createdAt: true },
				orderBy: { createdAt: "asc" },
			},
		},
	});

/** A studio: its account, site and every business record it owns. */
async function photographerData(id: string) {
	const own = { photographerId: id };
	const [studio, clients, bookings, projects, invoices] = await Promise.all([
		db.studio.findUnique({ where: own }),
		db.clientProfile.findMany({
			where: own,
			include: {
				client: { select: { name: true, email: true, phoneNumber: true } },
			},
		}),
		db.booking.findMany({ where: own, include: { activities: true } }),
		db.project.findMany({
			where: own,
			include: {
				galleries: {
					include: {
						items: {
							select: {
								filename: true,
								size: true,
								type: true,
								selected: true,
								createdAt: true,
							},
						},
					},
				},
			},
		}),
		db.invoice.findMany({
			where: own,
			include: { items: true, payments: true },
		}),
	]);
	const [packages, media, equipment, calendar, team, conversations] =
		await Promise.all([
			db.package.findMany({ where: own }),
			db.media.findMany({ where: own }),
			db.equipment.findMany({ where: own, include: { bookings: true } }),
			db.calendarEvent.findMany({ where: own }),
			db.teamMember.findMany({ where: own, include: { assignments: true } }),
			conversationsOf(own),
		]);
	return {
		studio,
		clients,
		bookings,
		projects,
		invoices,
		packages,
		media,
		equipment,
		calendar,
		team,
		conversations,
	};
}

/** A client: their requests, projects, invoices, words and picks. */
async function clientData(id: string) {
	const own = { clientId: id };
	const [bookings, projects, invoices, comments, conversations] =
		await Promise.all([
			db.booking.findMany({ where: own, omit: { internalNotes: true } }),
			db.project.findMany({
				where: own,
				omit: { internalNotes: true, financialNotes: true },
			}),
			db.invoice.findMany({
				where: own,
				include: { items: true, payments: true },
			}),
			db.galleryComment.findMany({
				where: { authorId: id },
				select: {
					body: true,
					createdAt: true,
					item: { select: { filename: true } },
				},
			}),
			conversationsOf(own),
		]);
	return { bookings, projects, invoices, comments, conversations };
}

export async function exportAccountData(userId: string) {
	const profile = await profileOf(userId);
	if (!profile) return null;
	const data =
		profile.role === ROLES.photographer
			? await photographerData(userId)
			: profile.role === ROLES.client
				? await clientData(userId)
				: {
						teamMemberships: await db.teamMember.findMany({
							where: { userId },
							include: { assignments: true },
						}),
					};
	return { exportedAt: new Date().toISOString(), profile, ...data };
}

/** JSON that survives BigInt sizes; Decimals already serialise to strings. */
export const toJson = (value: unknown) =>
	JSON.stringify(
		value,
		(_key, item) => (typeof item === "bigint" ? item.toString() : item),
		2,
	);
