import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { getMoneyOverview } from "@/services/money/queries";
import {
	getActiveEstimates,
	getProjectEstimate,
} from "@/services/projects/estimate";

/** Money to collect and how long the work will take: the studio's planning. */
export function planningTools(photographerId: string) {
	return {
		money_to_collect: tool({
			description:
				"Money the studio is still owed (unpaid invoices, photo books to cash, unbilled project balances), what is overdue, what was collected this month, and what to chase first.",
			inputSchema: z.object({}),
			execute: async () => getMoneyOverview(photographerId, 8),
		}),

		estimate_project: tool({
			description:
				"Smart estimate of when one project will be finished: hours of work left per task (import, culling, retouching, video editing, export), client waiting time, expected finish date and whether the delivery deadline is at risk. Explain the main reasons briefly.",
			inputSchema: z.object({ projectId: z.string() }),
			execute: async ({ projectId }) => {
				const found = await getProjectEstimate(photographerId, projectId);
				return found
					? { found: true as const, ...found }
					: { found: false as const };
			},
		}),

		workload_forecast: tool({
			description:
				"Every project not delivered yet with its expected finish date and hours of work left, soonest first, plus the total hours of work ahead. Use for 'am I overloaded?', 'what will be late?', 'when can I take a new project?'.",
			inputSchema: z.object({}),
			execute: async () => {
				const all = await getActiveEstimates(photographerId);
				const items = all.map(({ projectId, title, clientName, estimate }) => ({
					projectId,
					title,
					clientName,
					finishDate: estimate.finishDate,
					hoursLeft: estimate.hoursLeft,
					deadline: estimate.deadline,
				}));
				return {
					items: items.slice(0, 15),
					total: items.length,
					hoursAhead:
						Math.round(items.reduce((sum, i) => sum + i.hoursLeft, 0) * 10) /
						10,
					atRisk: items.filter((i) => i.deadline?.status === "late").length,
				};
			},
		}),
	};
}
