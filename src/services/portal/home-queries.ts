import "server-only";

import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/services/bookings/options";
import { countUnread } from "@/services/messages/queries";
import { CLIENT_VIEWABLE_PROJECT } from "@/services/projects/visibility";
import { type ClientIdentity, clientBookingWhere } from "./booking-queries";
import { pendingFor, verifiedContact } from "./contacts";

const LIST_LIMIT = 5;

const studioName = (photographer: {
	name: string;
	studio: { name: string } | null;
}) => photographer.studio?.name ?? photographer.name;

const photographerSelect = {
	select: { name: true, studio: { select: { name: true } } },
} as const;

/**
 * The client's home: the next shoot, and everything waiting on them, so the
 * portal opens on what to do rather than on a list to dig through.
 */
export async function getPortalHome(user: ClientIdentity) {
	const today = new Date(new Date().toISOString().slice(0, 10));
	const contact = verifiedContact(user);

	const [nextShoot, bookings, invitations, selections, balances, unread] =
		await Promise.all([
			db.project.findFirst({
				where: { clientId: user.id, eventDate: { gte: today } },
				orderBy: [{ eventDate: "asc" }, { id: "asc" }],
				select: {
					id: true,
					title: true,
					eventDate: true,
					startTime: true,
					location: true,
					photographer: photographerSelect,
				},
			}),
			// Requests the studio sent and the client still has to answer.
			db.booking.count({
				where: {
					...clientBookingWhere(user),
					sentToClientAt: { not: null },
					status: { in: [...OPEN_STATUSES] },
					clientAcceptedAt: null,
					source: { not: "PORTAL" },
				},
			}),
			contact.email || contact.phone
				? db.project.count({ where: pendingFor(contact) })
				: 0,
			// Galleries open for picking that the client hasn't sent yet.
			db.gallery.findMany({
				where: {
					sharedAt: { not: null },
					selectionEnabled: true,
					submittedAt: null,
					project: { clientId: user.id, ...CLIENT_VIEWABLE_PROJECT },
				},
				orderBy: [{ sharedAt: "desc" }, { id: "asc" }],
				take: LIST_LIMIT,
				select: { id: true, title: true, project: { select: { title: true } } },
			}),
			db.project.findMany({
				where: {
					clientId: user.id,
					price: { not: null },
					paymentStatus: { not: "PAID" },
				},
				orderBy: [{ eventDate: "asc" }, { id: "asc" }],
				take: LIST_LIMIT,
				select: { id: true, title: true, price: true, advance: true },
			}),
			countUnread({ id: user.id, role: "client" }),
		]);

	return {
		nextShoot: nextShoot && {
			projectId: nextShoot.id,
			title: nextShoot.title,
			eventDate: (nextShoot.eventDate as Date).toISOString(),
			startTime: nextShoot.startTime ?? "",
			location: nextShoot.location ?? "",
			studio: studioName(nextShoot.photographer),
		},
		bookings,
		invitations,
		selections: selections.map((gallery) => ({
			galleryId: gallery.id,
			title: gallery.title,
			projectTitle: gallery.project.title,
		})),
		balances: balances.map((project) => ({
			projectId: project.id,
			title: project.title,
			remaining: Math.max(
				0,
				(project.price?.toNumber() ?? 0) - project.advance.toNumber(),
			),
		})),
		unread,
	};
}

export type PortalHome = Awaited<ReturnType<typeof getPortalHome>>;

/**
 * Studios the client already works with: those of their projects and of the
 * requests sent to them. Only these can receive a request from the portal.
 */
export async function listClientStudios(user: ClientIdentity) {
	const [projects, bookings] = await Promise.all([
		db.project.findMany({
			where: { clientId: user.id },
			distinct: ["photographerId"],
			select: { photographerId: true, photographer: photographerSelect },
		}),
		db.booking.findMany({
			where: clientBookingWhere(user),
			distinct: ["photographerId"],
			select: { photographerId: true, photographer: photographerSelect },
		}),
	]);
	const studios = new Map<string, string>();
	for (const row of [...projects, ...bookings])
		studios.set(row.photographerId, studioName(row.photographer));
	return [...studios].map(([photographerId, name]) => ({
		photographerId,
		name,
	}));
}
