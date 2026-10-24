import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { listProjectInvoices } from "@/services/invoices/queries";
import { getProject, listProjects } from "@/services/projects/queries";
import { PROJECT_STAGES } from "@/services/projects/stages";
import { listProjectTeam } from "@/services/team/queries";
import { toInvoiceRow, toProjectRow, toRowPage } from "./rows";

const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max)}…` : text;

/** Listing projects and opening one with its galleries, team and invoices. */
export function projectTools(photographerId: string) {
	return {
		list_projects: tool({
			description:
				"List projects, newest first. Filter by text (title, client) and/or workflow stage. 20 per page.",
			inputSchema: z.object({
				q: z.string().max(100).optional(),
				stage: z.enum(PROJECT_STAGES).optional(),
				page: z.number().int().min(1).optional(),
			}),
			execute: async ({ q, stage, page }) =>
				toRowPage(
					await listProjects(photographerId, {
						page: page ?? 1,
						q: q?.trim() ?? "",
						stage,
					}),
					toProjectRow,
				),
		}),

		get_project: tool({
			description:
				"One project in detail: dates, place, client, money, galleries (with photo counts), team and invoices.",
			inputSchema: z.object({ projectId: z.string() }),
			execute: async ({ projectId }) => {
				const project = await getProject(photographerId, projectId);
				if (!project) return { found: false as const };
				const [team, invoices] = await Promise.all([
					listProjectTeam(photographerId, projectId),
					listProjectInvoices(photographerId, projectId),
				]);
				return {
					found: true as const,
					project: {
						...toProjectRow(project),
						client: project.client,
						startTime: project.startTime,
						endTime: project.endTime,
						location: project.location,
						advance: project.advance,
						deliveryDeadline: project.deliveryDeadline,
						description: clip(project.description, 600),
						internalNotes: clip(project.internalNotes, 600),
					},
					galleries: project.galleries.map((gallery) => ({
						id: gallery.id,
						title: gallery.title,
						kind: gallery.kind,
						itemCount: gallery.itemCount,
						selectedCount: gallery.selectedCount,
						shared: gallery.shared,
						submitted: gallery.submitted,
					})),
					team: team.map((a) => ({
						name: a.member.name,
						role: a.role || a.member.specialty,
						status: a.member.status,
					})),
					invoices: invoices.map(toInvoiceRow),
				};
			},
		}),
	};
}
