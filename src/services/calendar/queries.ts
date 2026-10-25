import "server-only";

import { db } from "@/lib/db";
import { getActiveEstimates } from "@/services/projects/estimate";
import { monthQueryRange } from "./dates";
import type { CalendarEntry, ProjectOption } from "./types";

/** Events and dated projects visible on a month page. */
export async function listCalendarEntries(
	photographerId: string,
	month: string,
): Promise<CalendarEntry[]> {
	const { from, to } = monthQueryRange(month);
	const [events, projects] = await Promise.all([
		db.calendarEvent.findMany({
			where: { photographerId, startsAt: { lt: to }, endsAt: { gte: from } },
			include: { project: { select: { title: true } } },
			orderBy: [{ startsAt: "asc" }, { id: "asc" }],
		}),
		// Projects already scheduled through an event would otherwise show twice.
		db.project.findMany({
			where: {
				photographerId,
				eventDate: { gte: from, lt: to },
				events: { none: {} },
			},
			select: { id: true, title: true, eventDate: true, location: true },
			orderBy: [{ eventDate: "asc" }, { id: "asc" }],
		}),
	]);

	const eventEntries = events.map(
		(event): CalendarEntry => ({
			id: event.id,
			kind: "event",
			type: event.type,
			title: event.title,
			allDay: event.allDay,
			startsAt: event.startsAt.toISOString(),
			endsAt: event.endsAt.toISOString(),
			location: event.location ?? "",
			notes: event.notes ?? "",
			projectId: event.projectId,
			projectTitle: event.project?.title ?? null,
		}),
	);
	const projectEntries = projects.flatMap((project): CalendarEntry[] => {
		if (!project.eventDate) return [];
		// Project dates are stored as UTC midnights, like all-day events.
		const day = project.eventDate.toISOString();
		return [
			{
				id: `project-${project.id}`,
				kind: "project",
				type: "PROJECT",
				title: project.title,
				allDay: true,
				startsAt: day,
				endsAt: day,
				location: project.location ?? "",
				notes: "",
				projectId: project.id,
				projectTitle: project.title,
			},
		];
	});
	return [...eventEntries, ...projectEntries];
}

/** Projects an event can be linked to, most recently active first. */
export async function listProjectOptions(
	photographerId: string,
): Promise<ProjectOption[]> {
	return db.project.findMany({
		where: { photographerId },
		select: { id: true, title: true },
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
	});
}

/** The days active projects should be finished, from the smart estimate, in a month. */
export async function listEstimateEntries(
	photographerId: string,
	month: string,
): Promise<CalendarEntry[]> {
	const estimates = await getActiveEstimates(photographerId);
	return estimates
		.filter(({ estimate }) => estimate.finishDate.startsWith(month))
		.map(({ projectId, title, estimate }) => {
			const day = `${estimate.finishDate}T00:00:00.000Z`;
			return {
				id: `estimate-${projectId}`,
				kind: "estimate",
				type: "ESTIMATE",
				title,
				allDay: true,
				startsAt: day,
				endsAt: day,
				location: "",
				notes: "",
				projectId,
				projectTitle: title,
			};
		});
}
