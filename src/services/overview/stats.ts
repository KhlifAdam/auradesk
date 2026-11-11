import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/services/bookings/options";
import { sharesProjectWith } from "@/services/clients/queries";
import { countUnread } from "@/services/messages/queries";
import { getMoneyOverview } from "@/services/money/queries";
import type { Period } from "./period";

/** A figure for the chosen period and, when there is one, the period before. */
export interface Compared {
	value: number;
	previous: number | null;
}

interface Range {
	from: Date | null;
	to: Date | null;
}

/** Prisma date filter for a range; open-ended bounds are left out. */
const between = (r: Range) =>
	r.from || r.to
		? { ...(r.from && { gte: r.from }), ...(r.to && { lt: r.to }) }
		: undefined;

/** Runs `run` for the period and, if there is one, for the previous one. */
async function compare(
	period: Period,
	run: (range: Range) => Promise<number>,
): Promise<Compared> {
	const [value, previous] = await Promise.all([
		run({ from: period.from, to: period.to }),
		period.previous ? run(period.previous) : Promise.resolve(null),
	]);
	return { value, previous };
}

const dateBound = (date: Date | null) => Prisma.sql`${date}::timestamp`;

/** New clients: those whose first project with this studio falls in the range. */
function newClients(photographerId: string, r: Range) {
	return db
		.$queryRaw<{ n: number }[]>(Prisma.sql`
			SELECT COUNT(*)::int AS n FROM (
				SELECT client_id, MIN(created_at) AS first_at
				FROM projects
				WHERE photographer_id = ${photographerId} AND client_id IS NOT NULL
				GROUP BY client_id
			) t
			WHERE (${dateBound(r.from)} IS NULL OR first_at >= ${dateBound(r.from)})
			  AND (${dateBound(r.to)} IS NULL OR first_at < ${dateBound(r.to)})`)
		.then((rows) => rows[0]?.n ?? 0);
}

/** Agreed value of the projects opened in the range, in TND. */
async function bookedValue(photographerId: string, r: Range) {
	const sum = await db.project.aggregate({
		where: { photographerId, createdAt: between(r) },
		_sum: { price: true },
	});
	return sum._sum.price?.toNumber() ?? 0;
}

/** Still owed today: unpaid invoices and project prices not invoiced yet. */
async function outstanding(photographerId: string) {
	// The same figure as the "Money to collect" card, never a second formula.
	return (await getMoneyOverview(photographerId, 0)).toCollect;
}

/** Photos and videos added to the library and to project galleries. */
async function uploads(photographerId: string, r: Range) {
	const where = { photographerId, createdAt: between(r) };
	const [media, items, mediaSize, itemSize] = await Promise.all([
		db.media.count({ where }),
		db.galleryItem.count({ where }),
		db.media.aggregate({ where, _sum: { size: true } }),
		db.galleryItem.aggregate({ where, _sum: { size: true } }),
	]);
	return {
		count: media + items,
		// Gallery sizes are BigInt (videos pass 2 GB); a sum fits a JS number.
		bytes: (mediaSize._sum.size ?? 0) + Number(itemSize._sum.size ?? 0),
	};
}

/** Items created per chart bucket, e.g. `{ "2026-10-08": 3 }`. */
async function perBucket(
	table: "bookings" | "projects",
	photographerId: string,
	period: Period,
	timeZone: string,
) {
	const format = period.granularity === "day" ? "YYYY-MM-DD" : "YYYY-MM";
	const rows = await db.$queryRaw<{ bucket: string; n: number }[]>(Prisma.sql`
		SELECT to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, ${format}) AS bucket,
		       COUNT(*)::int AS n
		FROM ${Prisma.raw(table)}
		WHERE photographer_id = ${photographerId}
		  AND created_at >= ${period.chart.from} AND created_at < ${period.chart.to}
		GROUP BY 1`);
	return new Map(rows.map((row) => [row.bucket, row.n]));
}

export async function getOverviewStats(
	photographerId: string,
	period: Period,
	timeZone: string,
) {
	const now = new Date();
	const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const range: Range = { from: period.from, to: period.to };

	const [
		bookingsCreated,
		bookingsConfirmed,
		clientsNew,
		projectsCreated,
		projectsDelivered,
		booked,
		bookingsByStatus,
		openBookings,
		clientsTotal,
		projectsByStage,
		owed,
		files,
		previousFiles,
		unread,
		upcoming,
		shootsNextWeek,
		bookingSeries,
		projectSeries,
	] = await Promise.all([
		compare(period, (r) =>
			db.booking.count({ where: { photographerId, createdAt: between(r) } }),
		),
		compare(period, (r) =>
			db.booking.count({
				where: { photographerId, confirmedAt: { not: null, ...between(r) } },
			}),
		),
		compare(period, (r) => newClients(photographerId, r)),
		compare(period, (r) =>
			db.project.count({ where: { photographerId, createdAt: between(r) } }),
		),
		compare(period, (r) =>
			db.project.count({
				where: { photographerId, deliveredAt: { not: null, ...between(r) } },
			}),
		),
		compare(period, (r) => bookedValue(photographerId, r)),
		db.booking.groupBy({
			by: ["status"],
			where: { photographerId, createdAt: between(range) },
			_count: { _all: true },
		}),
		db.booking.count({
			where: { photographerId, status: { in: [...OPEN_STATUSES] } },
		}),
		db.user.count({ where: sharesProjectWith(photographerId) }),
		db.project.groupBy({
			by: ["stage"],
			where: { photographerId },
			_count: { _all: true },
		}),
		outstanding(photographerId),
		uploads(photographerId, range),
		period.previous ? uploads(photographerId, period.previous) : null,
		countUnread({ id: photographerId, role: "photographer" }),
		db.calendarEvent.findMany({
			where: { photographerId, type: "SHOOT", startsAt: { gte: now } },
			orderBy: [{ startsAt: "asc" }, { id: "asc" }],
			take: 5,
			select: {
				id: true,
				title: true,
				startsAt: true,
				allDay: true,
				location: true,
				projectId: true,
			},
		}),
		db.calendarEvent.count({
			where: {
				photographerId,
				type: "SHOOT",
				startsAt: { gte: now, lt: nextWeek },
			},
		}),
		perBucket("bookings", photographerId, period, timeZone),
		perBucket("projects", photographerId, period, timeZone),
	]);

	return {
		bookings: {
			created: bookingsCreated,
			confirmed: bookingsConfirmed,
			open: openBookings,
			byStatus: Object.fromEntries(
				bookingsByStatus.map((g) => [g.status, g._count._all]),
			) as Record<string, number>,
		},
		clients: { new: clientsNew, total: clientsTotal },
		projects: {
			created: projectsCreated,
			delivered: projectsDelivered,
			byStage: Object.fromEntries(
				projectsByStage.map((g) => [g.stage, g._count._all]),
			) as Record<string, number>,
		},
		money: { booked, outstanding: owed },
		files: {
			count: { value: files.count, previous: previousFiles?.count ?? null },
			bytes: files.bytes,
		},
		unread,
		upcoming: upcoming.map((e) => ({
			...e,
			startsAt: e.startsAt.toISOString(),
		})),
		shootsNextWeek,
		series: period.buckets.map((key) => ({
			key,
			bookings: bookingSeries.get(key) ?? 0,
			projects: projectSeries.get(key) ?? 0,
		})),
	};
}

export type OverviewStats = Awaited<ReturnType<typeof getOverviewStats>>;
