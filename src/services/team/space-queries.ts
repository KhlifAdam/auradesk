import "server-only";

import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { ASSIGNED_PAGE_SIZE } from "./schemas";
import type {
	AssignedProjectDetail,
	AssignedProjectPage,
	TeamInvitation,
} from "./types";

// Collaborator side: every query is scoped by the member's own `userId`
// (accepted memberships only) or their verified email (invitations).

const studioName = (photographer: {
	name: string;
	studio: { name: string } | null;
}) => photographer.studio?.name ?? photographer.name;

const photographerSelect = {
	select: { name: true, studio: { select: { name: true } } },
} as const;

/** Invitations sent to an address the user has verified. */
export async function listTeamInvitations(
	email: string,
): Promise<TeamInvitation[]> {
	const rows = await db.teamMember.findMany({
		where: { email: email.toLowerCase(), status: "PENDING" },
		include: { photographer: photographerSelect },
		orderBy: [{ invitedAt: "desc" }, { id: "asc" }],
	});
	return rows.map((row) => ({
		id: row.id,
		studioName: studioName(row.photographer),
		specialty: row.specialty ?? "",
		invitedAt: row.invitedAt.toISOString(),
	}));
}

export async function countPendingTeamInvitations(email: string) {
	return db.teamMember.count({
		where: { email: email.toLowerCase(), status: "PENDING" },
	});
}

/** True when the user belongs to at least one studio's team. */
export async function isTeamMember(userId: string) {
	const count = await db.teamMember.count({
		where: { userId, status: "ACCEPTED" },
	});
	return count > 0;
}

const assignedWhere = (userId: string) => ({
	member: { userId, status: "ACCEPTED" as const },
});

/** The projects the user is assigned to, soonest shoot first. */
export async function listAssignedProjects(
	userId: string,
	page: number,
): Promise<AssignedProjectPage> {
	const where = assignedWhere(userId);
	const total = await db.projectAssignment.count({ where });
	const meta = pageMeta(page, total, ASSIGNED_PAGE_SIZE);
	const rows = await db.projectAssignment.findMany({
		where,
		include: {
			project: {
				select: {
					id: true,
					title: true,
					stage: true,
					eventDate: true,
					location: true,
					photographer: photographerSelect,
				},
			},
		},
		orderBy: [
			{ project: { eventDate: { sort: "desc", nulls: "last" } } },
			{ id: "asc" },
		],
		skip: pageSkip(meta.page, ASSIGNED_PAGE_SIZE),
		take: ASSIGNED_PAGE_SIZE,
	});
	return {
		...meta,
		items: rows.map(({ project, role }) => ({
			id: project.id,
			title: project.title,
			studioName: studioName(project.photographer),
			role: role ?? "",
			stage: project.stage,
			eventDate: project.eventDate?.toISOString() ?? null,
			location: project.location ?? "",
		})),
	};
}

/** One assigned project, with only what the crew needs on the day. */
export async function getAssignedProject(
	userId: string,
	projectId: string,
): Promise<AssignedProjectDetail | null> {
	const assignment = await db.projectAssignment.findFirst({
		where: { projectId, ...assignedWhere(userId) },
		select: { role: true },
	});
	if (!assignment) return null;

	const project = await db.project.findUniqueOrThrow({
		where: { id: projectId },
		select: {
			id: true,
			title: true,
			description: true,
			stage: true,
			serviceType: true,
			mediaType: true,
			eventDate: true,
			startTime: true,
			endTime: true,
			location: true,
			locationType: true,
			deliveryDeadline: true,
			contactName: true,
			contactPhone: true,
			photographer: photographerSelect,
			assignments: {
				select: {
					role: true,
					member: { select: { name: true, specialty: true } },
				},
				orderBy: { member: { name: "asc" } },
			},
			equipmentBookings: {
				select: {
					kind: true,
					startDate: true,
					endDate: true,
					equipment: { select: { name: true } },
				},
				orderBy: { equipment: { name: "asc" } },
			},
		},
	});

	return {
		id: project.id,
		title: project.title,
		studioName: studioName(project.photographer),
		role: assignment.role ?? "",
		stage: project.stage,
		eventDate: project.eventDate?.toISOString() ?? null,
		location: project.location ?? "",
		description: project.description ?? "",
		serviceType: project.serviceType,
		mediaType: project.mediaType,
		startTime: project.startTime ?? "",
		endTime: project.endTime ?? "",
		locationType: project.locationType,
		deliveryDeadline: project.deliveryDeadline?.toISOString() ?? null,
		contactName: project.contactName ?? "",
		contactPhone: project.contactPhone ?? "",
		team: project.assignments.map((row) => ({
			name: row.member.name,
			specialty: row.member.specialty ?? "",
			role: row.role ?? "",
		})),
		gear: project.equipmentBookings.map((row) => ({
			name: row.equipment.name,
			kind: row.kind,
			startDate: row.startDate.toISOString(),
			endDate: row.endDate.toISOString(),
		})),
	};
}
