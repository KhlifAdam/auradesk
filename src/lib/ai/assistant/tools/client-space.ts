import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
	getClientProjectStatus,
	listClientBooksForAssistant,
	listClientInvoicesForAssistant,
	listClientProjectsForAssistant,
	listClientStudioContacts,
} from "@/services/assistant/client-queries";
import {
	type ClientIdentity,
	listPortalBookings,
} from "@/services/portal/booking-queries";

/** A client's view: their own projects, invoices, requests and books, read-only. */
export function clientSpaceTools(identity: ClientIdentity) {
	const clientId = identity.id;
	return {
		client_projects: tool({
			description:
				"The client's projects with every studio: stage, date, studio, whether fully paid.",
			inputSchema: z.object({}),
			execute: async () => ({
				items: await listClientProjectsForAssistant(clientId),
			}),
		}),

		client_project_status: tool({
			description:
				"One of the client's projects in detail: where it stands, galleries to choose from, invoices and what is owed, photo books, expected ready date, and the next thing the client should do (nextStep).",
			inputSchema: z.object({ projectId: z.string() }),
			execute: async ({ projectId }) => {
				const project = await getClientProjectStatus(clientId, projectId);
				return project
					? { found: true as const, project }
					: { found: false as const };
			},
		}),

		client_invoices: tool({
			description:
				"The client's invoices from every studio, unpaid first, with what is left to pay.",
			inputSchema: z.object({}),
			execute: async () => ({
				items: await listClientInvoicesForAssistant(clientId),
			}),
		}),

		client_requests: tool({
			description:
				"The client's booking requests and quotes: status, studio, desired date, proposed price, whether they accepted.",
			inputSchema: z.object({}),
			execute: async () => ({ items: await listPortalBookings(identity) }),
		}),

		client_books: tool({
			description:
				"The client's photo books: title, status (DRAFT being designed, then SUBMITTED, ACCEPTED, IN_PRODUCTION, READY, DELIVERED) and price.",
			inputSchema: z.object({}),
			execute: async () => ({
				items: await listClientBooksForAssistant(clientId),
			}),
		}),

		studio_contacts: tool({
			description:
				"How to reach the studios the client works with: name, email, phone, city, website.",
			inputSchema: z.object({}),
			execute: async () => ({
				items: await listClientStudioContacts(clientId),
			}),
		}),
	};
}
