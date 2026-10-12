import "server-only";

import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/services/bookings/options";
import { todayUtc } from "@/services/equipment/options";

export type ReminderKind =
	| "prepareGear"
	| "noGear"
	| "brokenGear"
	| "noCrew"
	| "deadlineMissed"
	| "deadlineSoon"
	| "selectionToReview"
	| "overdueInvoices"
	| "bookingFollowUp"
	| "rentalReturn";

export interface Reminder {
	kind: ReminderKind;
	/** Red when something is already late, amber otherwise. */
	urgent: boolean;
	href: string;
	/** Values for the message: project title, gear list, counts… */
	values: Record<string, string | number>;
}

const DAY_MS = 86_400_000;
/** How far ahead shoots are prepared for. */
const SHOOT_HORIZON_DAYS = 7;
const DEADLINE_SOON_DAYS = 3;
/** Each rule shows its few most pressing cases; the pages list the rest. */
const PER_RULE = 4;
const GEAR_SHOWN = 5;

const addDays = (date: Date, days: number) =>
	new Date(date.getTime() + days * DAY_MS);

/** Shoots coming up: what to pack, what's missing, what's broken. */
async function shootReminders(photographerId: string, today: Date) {
	const shoots = await db.project.findMany({
		where: {
			photographerId,
			eventDate: { gte: today, lte: addDays(today, SHOOT_HORIZON_DAYS) },
			stage: { in: ["BOOKING", "PREP", "SHOOTING"] },
		},
		select: {
			id: true,
			title: true,
			eventDate: true,
			_count: { select: { assignments: true } },
			equipmentBookings: {
				select: { equipment: { select: { name: true, status: true } } },
				orderBy: { equipment: { name: "asc" } },
			},
		},
		orderBy: [{ eventDate: "asc" }, { id: "asc" }],
		take: PER_RULE,
	});

	return shoots.flatMap((shoot): Reminder[] => {
		const href = `/dashboard/projects/${shoot.id}`;
		const days = Math.round(
			((shoot.eventDate?.getTime() ?? 0) - today.getTime()) / DAY_MS,
		);
		const base = { project: shoot.title, days };
		const gear = shoot.equipmentBookings.map((row) => row.equipment);
		const broken = gear.filter((item) => item.status !== "ACTIVE");
		const list: Reminder[] = [];
		if (gear.length === 0)
			list.push({ kind: "noGear", urgent: days <= 1, href, values: base });
		else
			list.push({
				kind: "prepareGear",
				urgent: false,
				href,
				values: {
					...base,
					gear: gear
						.slice(0, GEAR_SHOWN)
						.map((item) => item.name)
						.join(", "),
					more: Math.max(0, gear.length - GEAR_SHOWN),
				},
			});
		if (broken.length > 0)
			list.push({
				kind: "brokenGear",
				urgent: true,
				href,
				values: { ...base, gear: broken.map((item) => item.name).join(", ") },
			});
		if (shoot._count.assignments === 0)
			list.push({ kind: "noCrew", urgent: false, href, values: base });
		return list;
	});
}

/** Deliveries that are late or due within a few days. */
async function deadlineReminders(photographerId: string, today: Date) {
	const projects = await db.project.findMany({
		where: {
			photographerId,
			stage: { not: "DELIVERY" },
			deliveryDeadline: { lte: addDays(today, DEADLINE_SOON_DAYS) },
		},
		select: { id: true, title: true, deliveryDeadline: true },
		orderBy: [{ deliveryDeadline: "asc" }, { id: "asc" }],
		take: PER_RULE,
	});
	return projects.map((project): Reminder => {
		const days = Math.round(
			((project.deliveryDeadline?.getTime() ?? 0) - today.getTime()) / DAY_MS,
		);
		const late = days < 0;
		return {
			kind: late ? "deadlineMissed" : "deadlineSoon",
			urgent: late,
			href: `/dashboard/projects/${project.id}`,
			values: { project: project.title, days: Math.abs(days) },
		};
	});
}

/** Everything else: selections, invoices, bookings, gear out on rental. */
async function followUpReminders(photographerId: string, today: Date) {
	const [selections, overdue, bookings, rentals] = await Promise.all([
		db.gallery.findMany({
			where: {
				photographerId,
				submittedAt: { not: null },
				project: { stage: { in: ["SELECTION", "ORGANIZATION", "IMPORT"] } },
			},
			select: { id: true, title: true, projectId: true },
			orderBy: { submittedAt: "asc" },
			take: PER_RULE,
		}),
		db.invoice.count({
			where: { photographerId, status: "SENT", dueDate: { lt: today } },
		}),
		db.booking.findMany({
			where: {
				photographerId,
				status: { in: [...OPEN_STATUSES] },
				responseDeadline: { lt: today },
			},
			select: { id: true, title: true },
			orderBy: { responseDeadline: "asc" },
			take: PER_RULE,
		}),
		db.equipmentBooking.findMany({
			where: {
				photographerId,
				kind: "RENTAL_OUT",
				returnedAt: null,
				endDate: { lte: today },
			},
			select: {
				equipmentId: true,
				partyName: true,
				equipment: { select: { name: true } },
			},
			orderBy: { endDate: "asc" },
			take: PER_RULE,
		}),
	]);

	return [
		...selections.map(
			(gallery): Reminder => ({
				kind: "selectionToReview",
				urgent: false,
				href: `/dashboard/projects/${gallery.projectId}/galleries/${gallery.id}?filter=selected`,
				values: { gallery: gallery.title },
			}),
		),
		...(overdue > 0
			? [
					{
						kind: "overdueInvoices",
						urgent: true,
						href: "/dashboard/invoices?status=OVERDUE",
						values: { count: overdue },
					} satisfies Reminder,
				]
			: []),
		...bookings.map(
			(booking): Reminder => ({
				kind: "bookingFollowUp",
				urgent: false,
				href: `/dashboard/bookings/${booking.id}`,
				values: { booking: booking.title },
			}),
		),
		...rentals.map(
			(rental): Reminder => ({
				kind: "rentalReturn",
				urgent: true,
				href: `/dashboard/equipment/${rental.equipmentId}`,
				values: {
					gear: rental.equipment.name,
					party: rental.partyName ?? "—",
				},
			}),
		),
	];
}

/**
 * The proactive assistant: looks across shoots, gear, deadlines, invoices and
 * requests, and says what needs doing now, most urgent first.
 */
export async function getAssistantReminders(
	photographerId: string,
): Promise<Reminder[]> {
	const today = todayUtc();
	const groups = await Promise.all([
		shootReminders(photographerId, today),
		deadlineReminders(photographerId, today),
		followUpReminders(photographerId, today),
	]);
	const all = groups.flat();
	return [...all.filter((r) => r.urgent), ...all.filter((r) => !r.urgent)];
}
