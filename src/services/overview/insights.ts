import "server-only";

import { Prisma, type ProjectServiceType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { roundMoney } from "@/services/invoices/totals";
import type { Period } from "./period";

interface Range {
	from: Date | null;
	to: Date | null;
}

const bound = (date: Date | null) => Prisma.sql`${date}::timestamp`;

/** SQL condition keeping `column` inside the range; open bounds are skipped. */
const within = (column: string, r: Range) => Prisma.sql`
	(${bound(r.from)} IS NULL OR ${Prisma.raw(column)} >= ${bound(r.from)})
	AND (${bound(r.to)} IS NULL OR ${Prisma.raw(column)} < ${bound(r.to)})`;

/** Money received on invoices, the same source as "Collected this month". */
async function collected(photographerId: string, r: Range) {
	const rows = await db.$queryRaw<{ total: string }[]>(Prisma.sql`
		SELECT COALESCE(SUM(p.amount), 0)::text AS total
		FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id
		WHERE i.photographer_id = ${photographerId} AND ${within("p.paid_at", r)}`);
	return roundMoney(Number(rows[0]?.total ?? 0));
}

/** Money received per chart bucket, e.g. `{ "2026-10": 1200 }`. */
async function revenuePerBucket(
	photographerId: string,
	period: Period,
	timeZone: string,
) {
	const format = period.granularity === "day" ? "YYYY-MM-DD" : "YYYY-MM";
	const rows = await db.$queryRaw<{ bucket: string; total: string }[]>(
		Prisma.sql`
		SELECT to_char(p.paid_at AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, ${format}) AS bucket,
		       SUM(p.amount)::text AS total
		FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id
		WHERE i.photographer_id = ${photographerId}
		  AND p.paid_at >= ${period.chart.from} AND p.paid_at < ${period.chart.to}
		GROUP BY 1`,
	);
	return new Map(rows.map((row) => [row.bucket, Number(row.total)]));
}

interface ProductionRow {
	delivered: number;
	from_shoot: number | null;
	from_start: number | null;
}

/**
 * Average days to deliver, for projects delivered in the range: from the
 * shoot (when it has a date) and from the moment the project was opened.
 */
async function productionTime(photographerId: string, r: Range) {
	const rows = await db.$queryRaw<ProductionRow[]>(Prisma.sql`
		SELECT COUNT(*)::int AS delivered,
		       AVG(EXTRACT(EPOCH FROM delivered_at - event_date) / 86400)
		         FILTER (WHERE event_date IS NOT NULL AND delivered_at >= event_date)::float AS from_shoot,
		       AVG(EXTRACT(EPOCH FROM delivered_at - created_at) / 86400)::float AS from_start
		FROM projects
		WHERE photographer_id = ${photographerId} AND delivered_at IS NOT NULL
		  AND ${within("delivered_at", r)}`);
	const row = rows[0];
	return {
		delivered: row?.delivered ?? 0,
		fromShoot: row?.from_shoot ?? null,
		fromStart: row?.from_start ?? null,
	};
}

/** Kinds of work opened in the range, most booked first, with their agreed value. */
async function topServices(photographerId: string, r: Range) {
	const rows = await db.$queryRaw<
		{ service: string; projects: number; value: string }[]
	>(Prisma.sql`
		SELECT service_type::text AS service, COUNT(*)::int AS projects,
		       COALESCE(SUM(price), 0)::text AS value
		FROM projects
		WHERE photographer_id = ${photographerId} AND ${within("created_at", r)}
		GROUP BY 1
		ORDER BY projects DESC, SUM(price) DESC NULLS LAST
		LIMIT 6`);
	return rows.map((row) => ({
		service: row.service as ProjectServiceType,
		projects: row.projects,
		value: roundMoney(Number(row.value)),
	}));
}

/** Revenue, production time and popular services for the chosen period. */
export async function getOverviewInsights(
	photographerId: string,
	period: Period,
	timeZone: string,
) {
	const range: Range = { from: period.from, to: period.to };
	const [
		revenue,
		previousRevenue,
		buckets,
		production,
		previousProduction,
		services,
	] = await Promise.all([
		collected(photographerId, range),
		period.previous ? collected(photographerId, period.previous) : null,
		revenuePerBucket(photographerId, period, timeZone),
		productionTime(photographerId, range),
		period.previous ? productionTime(photographerId, period.previous) : null,
		topServices(photographerId, range),
	]);

	return {
		revenue: {
			total: { value: revenue, previous: previousRevenue },
			series: period.buckets.map((key) => ({
				key,
				revenue: roundMoney(buckets.get(key) ?? 0),
			})),
		},
		production: {
			...production,
			previousFromShoot: previousProduction?.fromShoot ?? null,
		},
		services,
	};
}

export type OverviewInsights = Awaited<ReturnType<typeof getOverviewInsights>>;
