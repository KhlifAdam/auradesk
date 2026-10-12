import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { ADMIN_USERS_PAGE_SIZE, type ListUsersParams } from "./schemas";

// The admin sees accounts and public studio facts only. Nothing here reads a
// studio's clients, projects, files or money.

export interface PlatformStats {
	photographers: number;
	clients: number;
	collaborators: number;
	publishedSites: number;
	newThisMonth: number;
	banned: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
	const monthStart = new Date();
	monthStart.setUTCDate(1);
	monthStart.setUTCHours(0, 0, 0, 0);
	const [roles, publishedSites, newThisMonth, banned] = await Promise.all([
		db.user.groupBy({ by: ["role"], _count: { _all: true } }),
		db.studio.count({ where: { published: true } }),
		db.user.count({ where: { createdAt: { gte: monthStart } } }),
		db.user.count({ where: { banned: true } }),
	]);
	const count = (role: string) =>
		roles.find((row) => row.role === role)?._count._all ?? 0;
	return {
		photographers: count(ROLES.photographer),
		clients: count(ROLES.client),
		collaborators: count(ROLES.team),
		publishedSites,
		newThisMonth,
		banned,
	};
}

export interface AdminUserRow {
	id: string;
	name: string;
	/** Empty for phone-only accounts. */
	email: string;
	phone: string;
	role: string;
	createdAt: string;
	banned: boolean;
	banReason: string;
	studio: { name: string; slug: string; published: boolean } | null;
}

export async function listUsers({ page, q, role }: ListUsersParams) {
	const where: Prisma.UserWhereInput = {};
	if (role) where.role = role;
	if (q) {
		where.OR = [
			{ name: { contains: q, mode: "insensitive" } },
			{ email: { contains: q, mode: "insensitive" } },
			{ studio: { name: { contains: q, mode: "insensitive" } } },
		];
	}
	const total = await db.user.count({ where });
	const meta = pageMeta(page, total, ADMIN_USERS_PAGE_SIZE);
	const rows = await db.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			email: true,
			phoneNumber: true,
			role: true,
			createdAt: true,
			banned: true,
			banReason: true,
			studio: { select: { name: true, slug: true, published: true } },
		},
		orderBy: [{ createdAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, ADMIN_USERS_PAGE_SIZE),
		take: ADMIN_USERS_PAGE_SIZE,
	});
	return {
		...meta,
		items: rows.map(
			(row): AdminUserRow => ({
				id: row.id,
				name: row.name,
				email: realEmail(row.email) ?? "",
				phone: row.phoneNumber ?? "",
				role: row.role ?? ROLES.photographer,
				createdAt: row.createdAt.toISOString(),
				banned: Boolean(row.banned),
				banReason: row.banReason ?? "",
				studio: row.studio,
			}),
		),
	};
}
