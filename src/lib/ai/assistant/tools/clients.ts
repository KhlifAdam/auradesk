import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { listBookingsForClient } from "@/services/bookings/queries";
import { getClient, searchClients } from "@/services/clients/queries";
import { listInvoices } from "@/services/invoices/queries";
import { listProjects } from "@/services/projects/queries";
import { toBookingRow, toInvoiceRow, toProjectRow } from "./rows";

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Finding clients and summing up everything about one of them. */
export function clientTools(photographerId: string) {
	return {
		search_clients: tool({
			description:
				"Find the photographer's clients by name, email or phone. Use it to get a client's id from a name.",
			inputSchema: z.object({
				q: z.string().max(100).describe("Part of a name, email or phone"),
			}),
			execute: async ({ q }) => {
				const rows = await searchClients(photographerId, q.trim(), 8);
				return {
					items: rows.map((row) => ({
						id: row.id,
						name: row.name,
						email: row.email,
						phone: row.phone,
						image: row.image,
					})),
				};
			},
		}),

		client_summary: tool({
			description:
				"Everything about one client: contact, private notes, projects, booking requests, invoices and money totals.",
			inputSchema: z.object({ clientId: z.string() }),
			execute: async ({ clientId }) => {
				const client = await getClient(photographerId, clientId);
				if (!client) return { found: false as const };
				const [projects, bookings, invoices] = await Promise.all([
					listProjects(photographerId, { page: 1, q: "" }, clientId),
					listBookingsForClient(photographerId, client),
					listInvoices(photographerId, { page: 1, q: "" }, clientId),
				]);
				const live = invoices.items.filter((i) => i.status !== "CANCELLED");
				return {
					found: true as const,
					client: {
						id: client.id,
						name: client.name,
						email: client.email,
						phone: client.phone,
						image: client.image,
						notes: client.notes,
					},
					totals: {
						projects: projects.total,
						invoiced: round(live.reduce((sum, i) => sum + i.total, 0)),
						paid: round(live.reduce((sum, i) => sum + i.paid, 0)),
						outstanding: round(live.reduce((sum, i) => sum + i.balance, 0)),
					},
					projects: projects.items.map(toProjectRow),
					bookings: bookings.slice(0, 10).map(toBookingRow),
					invoices: invoices.items.slice(0, 10).map(toInvoiceRow),
				};
			},
		}),
	};
}
