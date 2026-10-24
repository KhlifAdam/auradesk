import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
	getAssignedProject,
	listAssignedProjects,
} from "@/services/team/space-queries";

/** A collaborator's view: only the projects they are assigned to, read-only. */
export function teamSpaceTools(userId: string) {
	return {
		my_projects: tool({
			description:
				"The projects this collaborator is assigned to, soonest shoot first, with their role.",
			inputSchema: z.object({ page: z.number().int().min(1).optional() }),
			execute: async ({ page }) => {
				const list = await listAssignedProjects(userId, page ?? 1);
				return {
					items: list.items,
					page: list.page,
					pageCount: list.pageCount,
					total: list.total,
				};
			},
		}),

		get_assigned_project: tool({
			description:
				"One assigned project in detail: times, place, on-site contact, crew and gear.",
			inputSchema: z.object({ projectId: z.string() }),
			execute: async ({ projectId }) => {
				const project = await getAssignedProject(userId, projectId);
				return project
					? { found: true as const, project }
					: { found: false as const };
			},
		}),
	};
}
