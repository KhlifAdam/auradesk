import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { availabilityOf, BLOCKING_KINDS, todayUtc } from "./options";
import {
	EQUIPMENT_BOOKING_PAGE_SIZE,
	EQUIPMENT_PAGE_SIZE,
	type ListEquipmentParams,
} from "./schemas";
import type {
	EquipmentBookingItem,
	EquipmentBookingPage,
	EquipmentDetail,
	EquipmentPage,
	EquipmentStats,
	EquipmentSummary,
} from "./types";

const toNumber = (value: { toNumber(): number } | null) =>
	value?.toNumber() ?? null;

/** Bookings that keep an item busy on `day`. */
function busyOn(day: Date): Prisma.EquipmentBookingWhereInput {
	return {
		kind: { in: [...BLOCKING_KINDS] },
		startDate: { lte: day },
		endDate: { gte: day },
		returnedAt: null,
	};
}

function summaryInclude(today: Date) {
	return {
		bookings: {
			where: {
				kind: { in: [...BLOCKING_KINDS] },
				endDate: { gte: today },
				returnedAt: null,
			},
			orderBy: [{ startDate: "asc" }, { id: "asc" }],
			take: 1,
		},
	} satisfies Prisma.EquipmentInclude;
}

type SummaryRow = Prisma.EquipmentGetPayload<{
	include: ReturnType<typeof summaryInclude>;
}>;

function toSummary(row: SummaryRow, today: Date): EquipmentSummary {
	const next = row.bookings[0] ?? null;
	const current = next && next.startDate <= today ? next.kind : null;
	return {
		id: row.id,
		name: row.name,
		category: row.category,
		brand: row.brand ?? "",
		model: row.model ?? "",
		status: row.status,
		ownership: row.ownership,
		availability: availabilityOf(row.status, current),
		nextBooking: next && {
			startDate: next.startDate.toISOString(),
			endDate: next.endDate.toISOString(),
			kind: next.kind,
		},
	};
}

function listWhere(
	photographerId: string,
	{ q, category, availability }: ListEquipmentParams,
	today: Date,
): Prisma.EquipmentWhereInput {
	const where: Prisma.EquipmentWhereInput = { photographerId };
	if (category) where.category = category;
	if (availability === "BROKEN" || availability === "RETIRED")
		where.status = availability;
	else if (availability === "BUSY") {
		where.status = "ACTIVE";
		where.bookings = { some: busyOn(today) };
	} else if (availability === "AVAILABLE") {
		where.status = "ACTIVE";
		where.bookings = { none: busyOn(today) };
	}
	if (q) {
		where.OR = [
			{ name: { contains: q, mode: "insensitive" } },
			{ brand: { contains: q, mode: "insensitive" } },
			{ model: { contains: q, mode: "insensitive" } },
			{ serialNumber: { contains: q, mode: "insensitive" } },
		];
	}
	return where;
}

export async function listEquipment(
	photographerId: string,
	params: ListEquipmentParams,
): Promise<EquipmentPage> {
	const today = todayUtc();
	const where = listWhere(photographerId, params, today);
	const total = await db.equipment.count({ where });
	const meta = pageMeta(params.page, total, EQUIPMENT_PAGE_SIZE);
	const rows = await db.equipment.findMany({
		where,
		include: summaryInclude(today),
		orderBy: [{ category: "asc" }, { name: "asc" }, { id: "asc" }],
		skip: pageSkip(meta.page, EQUIPMENT_PAGE_SIZE),
		take: EQUIPMENT_PAGE_SIZE,
	});
	return { ...meta, items: rows.map((row) => toSummary(row, today)) };
}

export async function getEquipmentStats(
	photographerId: string,
): Promise<EquipmentStats> {
	const today = todayUtc();
	const [total, unavailable, busy] = await Promise.all([
		db.equipment.count({ where: { photographerId } }),
		db.equipment.count({
			where: { photographerId, status: { not: "ACTIVE" } },
		}),
		db.equipment.count({
			where: {
				photographerId,
				status: "ACTIVE",
				bookings: { some: busyOn(today) },
			},
		}),
	]);
	return { total, unavailable, busy, available: total - unavailable - busy };
}

export async function getEquipment(
	photographerId: string,
	id: string,
): Promise<EquipmentDetail | null> {
	const today = todayUtc();
	const row = await db.equipment.findFirst({
		where: { id, photographerId },
		include: summaryInclude(today),
	});
	if (!row) return null;
	const income = await db.equipmentBooking.aggregate({
		where: { equipmentId: id, kind: "RENTAL_OUT" },
		_sum: { amount: true },
	});

	return {
		...toSummary(row, today),
		serialNumber: row.serialNumber ?? "",
		purchaseDate: row.purchaseDate?.toISOString() ?? null,
		purchasePrice: toNumber(row.purchasePrice),
		dailyRate: toNumber(row.dailyRate),
		notes: row.notes ?? "",
		rentalIncome: toNumber(income._sum.amount) ?? 0,
	};
}

const bookingInclude = {
	project: { select: { id: true, title: true } },
	equipment: { select: { name: true } },
} satisfies Prisma.EquipmentBookingInclude;

type BookingRow = Prisma.EquipmentBookingGetPayload<{
	include: typeof bookingInclude;
}>;

function toBookingItem(row: BookingRow): EquipmentBookingItem {
	return {
		id: row.id,
		equipmentId: row.equipmentId,
		equipmentName: row.equipment.name,
		kind: row.kind,
		startDate: row.startDate.toISOString(),
		endDate: row.endDate.toISOString(),
		project: row.project,
		partyName: row.partyName ?? "",
		amount: toNumber(row.amount),
		notes: row.notes ?? "",
		returnedAt: row.returnedAt?.toISOString() ?? null,
	};
}

/** An item's bookings, latest first. */
export async function listEquipmentBookings(
	photographerId: string,
	equipmentId: string,
	page: number,
): Promise<EquipmentBookingPage> {
	const where = { photographerId, equipmentId };
	const total = await db.equipmentBooking.count({ where });
	const meta = pageMeta(page, total, EQUIPMENT_BOOKING_PAGE_SIZE);
	const rows = await db.equipmentBooking.findMany({
		where,
		include: bookingInclude,
		orderBy: [{ startDate: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, EQUIPMENT_BOOKING_PAGE_SIZE),
		take: EQUIPMENT_BOOKING_PAGE_SIZE,
	});
	return { ...meta, items: rows.map(toBookingItem) };
}

/** The gear booked for one project (a project only uses a handful). */
export async function listProjectEquipment(
	photographerId: string,
	projectId: string,
): Promise<EquipmentBookingItem[]> {
	const rows = await db.equipmentBooking.findMany({
		where: { photographerId, projectId },
		include: bookingInclude,
		orderBy: [
			{ equipment: { category: "asc" } },
			{ equipment: { name: "asc" } },
		],
	});
	return rows.map(toBookingItem);
}
