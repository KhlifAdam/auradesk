import "server-only";

import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";

// Platform-wide numbers for the admin: sign-ups and storage. Sizes and
// counts only, never what a studio stores.

const MONTHS = 12;

export interface SignupPoint {
	/** "2026-10" */
	key: string;
	photographers: number;
	clients: number;
}

/** New photographer and client accounts per month, the last 12 months. */
export async function getSignupSeries(
	now = new Date(),
): Promise<SignupPoint[]> {
	const start = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS - 1), 1),
	);
	const rows = await db.$queryRaw<
		{ month: Date; role: string | null; count: number }[]
	>`select date_trunc('month', created_at) as month, role, count(*)::int as count
	  from users where created_at >= ${start} group by 1, 2`;

	return Array.from({ length: MONTHS }, (_, i) => {
		const month = new Date(
			Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1),
		);
		const key = month.toISOString().slice(0, 7);
		const of = (role: string) =>
			rows.find(
				(row) =>
					row.role === role && row.month.toISOString().slice(0, 7) === key,
			)?.count ?? 0;
		return {
			key,
			photographers: of(ROLES.photographer),
			clients: of(ROLES.client),
		};
	});
}

export interface StorageOverview {
	/** Bytes of delivered photos and videos (finals galleries). */
	finals: number;
	/** Bytes of light proofing copies. */
	proofs: number;
	/** Bytes of public media (portfolio, logos, covers). */
	portfolio: number;
	top: { userId: string; name: string; bytes: number }[];
}

const TOP_STUDIOS = 8;

/** What the buckets hold, split by use, and the studios using the most. */
export async function getStorageOverview(): Promise<StorageOverview> {
	const [finals, proofs, portfolio, byGallery, byMedia] = await Promise.all([
		db.galleryItem.aggregate({
			where: { gallery: { kind: "FINAL" } },
			_sum: { size: true },
		}),
		db.galleryItem.aggregate({
			where: { gallery: { kind: "PROOFS" } },
			_sum: { size: true },
		}),
		db.media.aggregate({ _sum: { size: true } }),
		db.galleryItem.groupBy({ by: ["photographerId"], _sum: { size: true } }),
		db.media.groupBy({ by: ["photographerId"], _sum: { size: true } }),
	]);

	const bytes = new Map<string, number>();
	for (const row of byGallery)
		bytes.set(row.photographerId, Number(row._sum.size ?? 0));
	for (const row of byMedia)
		bytes.set(
			row.photographerId,
			(bytes.get(row.photographerId) ?? 0) + (row._sum.size ?? 0),
		);
	const ranked = [...bytes.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_STUDIOS);
	const users = await db.user.findMany({
		where: { id: { in: ranked.map(([id]) => id) } },
		select: { id: true, name: true, studio: { select: { name: true } } },
	});

	return {
		finals: Number(finals._sum.size ?? 0),
		proofs: Number(proofs._sum.size ?? 0),
		portfolio: portfolio._sum.size ?? 0,
		top: ranked.map(([userId, total]) => {
			const user = users.find((u) => u.id === userId);
			return {
				userId,
				name: user?.studio?.name ?? user?.name ?? "?",
				bytes: total,
			};
		}),
	};
}
