import "server-only";

import { db } from "@/lib/db";
import {
	type StudioBrand,
	studioBrandSelect,
	toStudioBrand,
} from "@/services/clients/branding";
import {
	type PageMeta,
	pageMeta,
	pageSkip,
} from "@/services/shared/pagination";
import { type ClientIdentity, clientBookingWhere } from "./booking-queries";

export const STUDIO_PAGE_SIZE = 12;

export interface PortalStudio {
	photographerId: string;
	photographerName: string;
	image: string | null;
	studio: StudioBrand | null;
	projectCount: number;
	bookingCount: number;
	/** The latest change to one of their shared projects or bookings. */
	lastActivity: string | null;
}

interface Activity {
	projectCount: number;
	bookingCount: number;
	last: Date | null;
}

const later = (a: Date | null, b: Date | null) =>
	a && b ? (a > b ? a : b) : (a ?? b);

/**
 * The photographers the client is in contact with: through a project they
 * joined or a booking they can see. Most recently active first.
 */
export async function listPortalStudios(
	user: ClientIdentity,
	requestedPage: number,
): Promise<PageMeta & { items: PortalStudio[] }> {
	const [projects, bookings] = await Promise.all([
		db.project.groupBy({
			by: ["photographerId"],
			where: { clientId: user.id },
			_count: { _all: true },
			_max: { updatedAt: true },
		}),
		db.booking.groupBy({
			by: ["photographerId"],
			where: clientBookingWhere(user),
			_count: { _all: true },
			_max: { updatedAt: true },
		}),
	]);

	const activity = new Map<string, Activity>();
	const entry = (id: string) =>
		activity.get(id) ?? { projectCount: 0, bookingCount: 0, last: null };
	for (const row of projects) {
		const current = entry(row.photographerId);
		activity.set(row.photographerId, {
			...current,
			projectCount: row._count._all,
			last: later(current.last, row._max.updatedAt),
		});
	}
	for (const row of bookings) {
		const current = entry(row.photographerId);
		activity.set(row.photographerId, {
			...current,
			bookingCount: row._count._all,
			last: later(current.last, row._max.updatedAt),
		});
	}

	// A client works with a handful of studios: sorting them here is cheap.
	const ordered = [...activity].sort(
		([idA, a], [idB, b]) =>
			(b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0) ||
			idA.localeCompare(idB),
	);
	const meta = pageMeta(requestedPage, ordered.length, STUDIO_PAGE_SIZE);
	const pageIds = ordered
		.slice(pageSkip(meta.page, STUDIO_PAGE_SIZE))
		.slice(0, STUDIO_PAGE_SIZE)
		.map(([id]) => id);

	const users = await db.user.findMany({
		where: { id: { in: pageIds } },
		select: {
			id: true,
			name: true,
			image: true,
			studio: { select: studioBrandSelect },
		},
	});
	const byId = new Map(users.map((row) => [row.id, row]));

	const items = pageIds.flatMap((id) => {
		const row = byId.get(id);
		const stats = activity.get(id);
		if (!row || !stats) return [];
		return {
			photographerId: id,
			photographerName: row.name,
			image: row.image,
			studio: row.studio ? toStudioBrand(row.studio) : null,
			projectCount: stats.projectCount,
			bookingCount: stats.bookingCount,
			lastActivity: stats.last?.toISOString() ?? null,
		};
	});
	return { ...meta, items };
}
