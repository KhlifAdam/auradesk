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

/**
 * Bookings a client may open: those sent to them, linked to their account or
 * addressed to an email or phone number they have verified.
 */
export function clientBookingWhere(
	user: ClientIdentity,
): Prisma.BookingWhereInput {
	const { email, phone } = verifiedContact(user);
	return {
		sentToClientAt: { not: null },
		OR: [
			{ clientId: user.id },
			...(email ? [{ clientEmail: email.toLowerCase() }] : []),
			...(phone ? [{ clientPhone: phone }] : []),
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
	/** Asked by the client from their space, not sent by the studio. */
	requestedByClient: boolean;
}

export interface PortalBookingDetail extends PortalBookingSummary {
	photographerId: string;
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
	photographer: { select: { name: true, studio: { select: { name: true } } } },
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
		requestedByClient: row.source === "PORTAL",
	};
}

const BOOKINGS_LIMIT = 20;

/** The requests waiting for this client, most recently sent first. */
export async function listPortalBookings(
	user: ClientIdentity,
): Promise<PortalBookingSummary[]> {
	const rows = await db.booking.findMany({
		where: clientBookingWhere(user),
		include,
		orderBy: [{ sentToClientAt: "desc" }, { id: "asc" }],
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
