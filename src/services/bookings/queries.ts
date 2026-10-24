import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { OPEN_STATUSES } from "./options";
import { BOOKING_PAGE_SIZE, type ListBookingsParams } from "./schemas";
import type {
	BookingDetail,
	BookingPage,
	BookingStats,
	BookingSummary,
} from "./types";

const toNumber = (value: { toNumber(): number } | null) =>
	value?.toNumber() ?? null;

type SummaryRow = Prisma.BookingGetPayload<object>;

function toSummary(row: SummaryRow): BookingSummary {
	return {
		id: row.id,
		title: row.title,
		status: row.status,
		clientName: row.clientName,
		serviceType: row.serviceType,
		desiredDate: row.desiredDate?.toISOString() ?? null,
		proposedPrice: toNumber(row.proposedPrice),
		createdAt: row.createdAt.toISOString(),
	};
}

const listOrder = [
	{ desiredDate: { sort: "asc", nulls: "last" } },
	{ createdAt: "desc" },
	{ id: "asc" },
] satisfies Prisma.BookingOrderByWithRelationInput[];

export async function listBookings(
	photographerId: string,
	{ page, q, status }: ListBookingsParams,
): Promise<BookingPage> {
	const where: Prisma.BookingWhereInput = { photographerId };
	if (status) where.status = status;
	if (q) {
		where.OR = [
			{ title: { contains: q, mode: "insensitive" } },
			{ clientName: { contains: q, mode: "insensitive" } },
			{ clientEmail: { contains: q, mode: "insensitive" } },
		];
	}
	const total = await db.booking.count({ where });
	const meta = pageMeta(page, total, BOOKING_PAGE_SIZE);
	const rows = await db.booking.findMany({
		where,
		orderBy: listOrder,
		skip: pageSkip(meta.page, BOOKING_PAGE_SIZE),
		take: BOOKING_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toSummary) };
}

/** Requests still waiting on someone (new, in discussion, quote sent). */
export async function listOpenBookings(
	photographerId: string,
	page: number,
): Promise<BookingPage> {
	const where: Prisma.BookingWhereInput = {
		photographerId,
		status: { in: [...OPEN_STATUSES] },
	};
	const total = await db.booking.count({ where });
	const meta = pageMeta(page, total, BOOKING_PAGE_SIZE);
	const rows = await db.booking.findMany({
		where,
		orderBy: listOrder,
		skip: pageSkip(meta.page, BOOKING_PAGE_SIZE),
		take: BOOKING_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toSummary) };
}

/** Counts for the dashboard header: everything, waiting, confirmed, closed. */
export async function getBookingStats(
	photographerId: string,
): Promise<BookingStats> {
	const groups = await db.booking.groupBy({
		by: ["status"],
		where: { photographerId },
		_count: { _all: true },
	});
	const count = (statuses: readonly string[]) =>
		groups
			.filter((group) => statuses.includes(group.status))
			.reduce((sum, group) => sum + group._count._all, 0);
	return {
		total: count([...OPEN_STATUSES, "CONFIRMED", "DECLINED"]),
		pending: count(OPEN_STATUSES),
		confirmed: count(["CONFIRMED"]),
		closed: count(["DECLINED"]),
	};
}

export async function getBooking(
	photographerId: string,
	id: string,
): Promise<BookingDetail | null> {
	const row = await db.booking.findFirst({
		where: { id, photographerId },
		include: {
			project: { select: { id: true, title: true } },
			activities: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
		},
	});
	if (!row) return null;

	return {
		...toSummary(row),
		source: row.source,
		clientId: row.clientId,
		clientEmail: row.clientEmail ?? "",
		clientPhone: row.clientPhone ?? "",
		mediaType: row.mediaType,
		description: row.description ?? "",
		startTime: row.startTime ?? "",
		durationMinutes: row.durationMinutes,
		location: row.location ?? "",
		clientBudget: toNumber(row.clientBudget),
		plannedAdvance: toNumber(row.plannedAdvance),
		responseDeadline: row.responseDeadline?.toISOString() ?? null,
		internalNotes: row.internalNotes ?? "",
		statusReason: row.statusReason ?? "",
		confirmedAt: row.confirmedAt?.toISOString() ?? null,
		sentToClientAt: row.sentToClientAt?.toISOString() ?? null,
		clientAcceptedAt: row.clientAcceptedAt?.toISOString() ?? null,
		project: row.project,
		activities: row.activities.map((activity) => ({
			id: activity.id,
			kind: activity.kind,
			fromStatus: activity.fromStatus,
			toStatus: activity.toStatus,
			body: activity.body ?? "",
			createdAt: activity.createdAt.toISOString(),
		})),
	};
}

const CLIENT_BOOKINGS_LIMIT = 10;

/** A client's most recent bookings, by account link or by the email they used. */
export async function listBookingsForClient(
	photographerId: string,
	client: { id: string; email: string; phone: string },
): Promise<BookingSummary[]> {
	const rows = await db.booking.findMany({
		where: {
			photographerId,
			OR: [
				{ clientId: client.id },
				...(client.email
					? [
							{
								clientEmail: {
									equals: client.email,
									mode: "insensitive" as const,
								},
							},
						]
					: []),
				...(client.phone ? [{ clientPhone: client.phone }] : []),
			],
		},
		orderBy: [{ createdAt: "desc" }, { id: "asc" }],
		take: CLIENT_BOOKINGS_LIMIT,
	});
	return rows.map(toSummary);
}
