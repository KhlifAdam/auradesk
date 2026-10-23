import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { BookingStatus } from "@/services/bookings/options";
import { isOpenStatus } from "@/services/bookings/options";
import type { MediaType, ServiceType } from "@/services/projects/options";
import { verifiedContact } from "./contacts";

/** The part of a session user that identifies a client. */
export interface ClientIdentity {
	id: string;
	email: string;
	emailVerified: boolean;
	phoneNumber?: string | null;
	phoneNumberVerified?: boolean | null;
}

/** Requests the client made themselves, from the public site or the portal. */
const CLIENT_SOURCES = ["WEBSITE", "PORTAL"] as const;

/**
 * Bookings a client may open: those the studio sent them and those they asked
 * for themselves, linked to their account or addressed to an email or phone
 * number they have verified.
 */
export function clientBookingWhere(
	user: ClientIdentity,
): Prisma.BookingWhereInput {
	const { email, phone } = verifiedContact(user);
	return {
		AND: [
			{
				OR: [
					{ sentToClientAt: { not: null } },
					{ source: { in: [...CLIENT_SOURCES] } },
				],
			},
			{
				OR: [
					{ clientId: user.id },
					...(email ? [{ clientEmail: email.toLowerCase() }] : []),
					...(phone ? [{ clientPhone: phone }] : []),
				],
			},
		],
	};
}

export interface PortalBookingSummary {
	id: string;
	title: string;
	status: BookingStatus;
	studioName: string;
	serviceType: ServiceType;
	desiredDate: string | null;
	proposedPrice: number | null;
	accepted: boolean;
	/** Asked by the client (public site or portal), not sent by the studio. */
	requestedByClient: boolean;
}

export interface PortalBookingDetail extends PortalBookingSummary {
	photographerId: string;
	/** The studio's public site, when it is published. */
	siteSlug: string | null;
	clientName: string;
	clientPhone: string;
	mediaType: MediaType;
	description: string;
	startTime: string;
	durationMinutes: number | null;
	location: string;
	clientBudget: number | null;
	plannedAdvance: number | null;
	responseDeadline: string | null;
	statusReason: string;
	/** The client can still change their part and answer. */
	editable: boolean;
	/** Set once confirmed: the project to open. */
	projectId: string | null;
}

const include = {
	photographer: {
		select: {
			name: true,
			studio: { select: { name: true, slug: true, published: true } },
		},
	},
	project: { select: { id: true, clientId: true } },
} satisfies Prisma.BookingInclude;

type Row = Prisma.BookingGetPayload<{ include: typeof include }>;

const toNumber = (value: { toNumber(): number } | null) =>
	value?.toNumber() ?? null;

function toSummary(row: Row): PortalBookingSummary {
	return {
		id: row.id,
		title: row.title,
		status: row.status,
		studioName: row.photographer.studio?.name ?? row.photographer.name,
		serviceType: row.serviceType,
		desiredDate: row.desiredDate?.toISOString() ?? null,
		proposedPrice: toNumber(row.proposedPrice),
		accepted: row.clientAcceptedAt !== null,
		requestedByClient: (CLIENT_SOURCES as readonly string[]).includes(
			row.source,
		),
	};
}

const BOOKINGS_LIMIT = 20;

/** The client's requests, most recently changed first. */
export async function listPortalBookings(
	user: ClientIdentity,
): Promise<PortalBookingSummary[]> {
	const rows = await db.booking.findMany({
		where: clientBookingWhere(user),
		include,
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		take: BOOKINGS_LIMIT,
	});
	return rows.map(toSummary);
}

export async function getPortalBooking(
	user: ClientIdentity,
	id: string,
): Promise<PortalBookingDetail | null> {
	const row = await db.booking.findFirst({
		where: { id, ...clientBookingWhere(user) },
		include,
	});
	if (!row) return null;

	return {
		...toSummary(row),
		photographerId: row.photographerId,
		siteSlug: row.photographer.studio?.published
			? row.photographer.studio.slug
			: null,
		clientName: row.clientName,
		clientPhone: row.clientPhone ?? "",
		mediaType: row.mediaType,
		description: row.description ?? "",
		startTime: row.startTime ?? "",
		durationMinutes: row.durationMinutes,
		location: row.location ?? "",
		clientBudget: toNumber(row.clientBudget),
		plannedAdvance: toNumber(row.plannedAdvance),
		responseDeadline: row.responseDeadline?.toISOString() ?? null,
		statusReason: row.statusReason ?? "",
		editable: isOpenStatus(row.status) && row.clientAcceptedAt === null,
		// Only a project the client has actually joined is linked.
		projectId: row.project?.clientId === user.id ? row.project.id : null,
	};
}
