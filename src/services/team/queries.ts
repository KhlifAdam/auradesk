import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { type ListTeamParams, TEAM_PAGE_SIZE } from "./schemas";
import type { ProjectAssignmentItem, TeamPage } from "./types";

// Studio side: every query is scoped by `photographerId`.

export async function listTeamMembers(
	photographerId: string,
	{ page, q }: ListTeamParams,
): Promise<TeamPage> {
	const where: Prisma.TeamMemberWhereInput = { photographerId };
	if (q) {
		where.OR = [
			{ name: { contains: q, mode: "insensitive" } },
			{ email: { contains: q, mode: "insensitive" } },
			{ specialty: { contains: q, mode: "insensitive" } },
		];
	}
	const total = await db.teamMember.count({ where });
	const meta = pageMeta(page, total, TEAM_PAGE_SIZE);
	const rows = await db.teamMember.findMany({
		where,
		include: { _count: { select: { assignments: true } } },
		orderBy: [{ name: "asc" }, { id: "asc" }],
		skip: pageSkip(meta.page, TEAM_PAGE_SIZE),
		take: TEAM_PAGE_SIZE,
	});
	return {
		...meta,
		items: rows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			specialty: row.specialty ?? "",
			status: row.status,
			invitedAt: row.invitedAt.toISOString(),
			projectCount: row._count.assignments,
		})),
	};
}

export async function getTeamStats(photographerId: string) {
	const groups = await db.teamMember.groupBy({
		by: ["status"],
		where: { photographerId },
		_count: { _all: true },
	});
	const count = (status: string) =>
		groups.find((group) => group.status === status)?._count._all ?? 0;
	return {
		total: groups.reduce((sum, group) => sum + group._count._all, 0),
		active: count("ACCEPTED"),
		pending: count("PENDING"),
	};
}

/** Who works on a project (a crew is a handful of people). */
export async function listProjectTeam(
	photographerId: string,
	projectId: string,
): Promise<ProjectAssignmentItem[]> {
	const rows = await db.projectAssignment.findMany({
		where: { projectId, project: { photographerId } },
		include: {
			member: {
				select: { id: true, name: true, specialty: true, status: true },
			},
		},
		orderBy: [{ member: { name: "asc" } }, { id: "asc" }],
	});
	return rows.map((row) => ({
		id: row.id,
		role: row.role ?? "",
		member: { ...row.member, specialty: row.member.specialty ?? "" },
	}));
}
