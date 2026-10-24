import "server-only";

import { tool } from "ai";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { getAssistantReminders } from "@/services/ai/reminders";
import { monthSchema } from "@/services/calendar/dates";
import { listCalendarEntries } from "@/services/calendar/queries";
import { listEquipment } from "@/services/equipment/queries";
import { listConversations } from "@/services/messages/queries";
import { resolvePeriod } from "@/services/overview/period";
import { getOverviewStats } from "@/services/overview/stats";
import { listTeamMembers } from "@/services/team/queries";

interface InsightContext {
	photographerId: string;
	locale: Locale;
	timeZone: string;
}

const STAT_PERIODS = ["week", "month", "last30", "year", "all"] as const;

const thisMonth = (timeZone: string) =>
	new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
	}).format(new Date());

/** The studio at a glance: to-dos, agenda, numbers, inbox, team and gear. */
export function insightTools({
	photographerId,
	locale,
	timeZone,
}: InsightContext) {
	return {
		todo: tool({
			description:
				"What needs attention now: shoots to prepare, missing gear or crew, deadlines, selections to review, overdue invoices, requests to follow up.",
			inputSchema: z.object({}),
			execute: async () => {
				const t = await getTranslations({ locale, namespace: "Ai.reminders" });
				const reminders = await getAssistantReminders(photographerId);
				return {
					items: reminders.map((r) => ({
						text: t(r.kind, r.values),
						urgent: r.urgent,
						href: r.href,
					})),
				};
			},
		}),

		agenda: tool({
			description:
				"Calendar entries (shoots, meetings, availability, project dates) for one month.",
			inputSchema: z.object({
				month: monthSchema
					.optional()
					.describe("YYYY-MM; this month if omitted"),
			}),
			execute: async ({ month }) => {
				const key = month ?? thisMonth(timeZone);
				const entries = await listCalendarEntries(photographerId, key);
				return {
					month: key,
					timeZone,
					items: entries.slice(0, 60).map((e) => ({
						id: e.id,
						kind: e.kind,
						type: e.type,
						title: e.title || e.projectTitle || "",
						allDay: e.allDay,
						startsAt: e.startsAt,
						endsAt: e.endsAt,
						location: e.location,
						projectId: e.projectId,
					})),
				};
			},
		}),

		stats: tool({
			description:
				"Business numbers for a period, compared with the previous one: bookings, clients, projects, money booked and still owed, upcoming shoots.",
			inputSchema: z.object({ period: z.enum(STAT_PERIODS).optional() }),
			execute: async ({ period }) => {
				const range = resolvePeriod(
					{ period: period ?? "month" },
					timeZone,
					locale === "fr" ? 1 : 0,
				);
				const s = await getOverviewStats(photographerId, range, timeZone);
				return {
					period: period ?? "month",
					bookings: {
						created: s.bookings.created,
						confirmed: s.bookings.confirmed,
						open: s.bookings.open,
					},
					clients: s.clients,
					projects: {
						created: s.projects.created,
						delivered: s.projects.delivered,
					},
					money: s.money,
					upcoming: s.upcoming,
				};
			},
		}),

		unread_messages: tool({
			description:
				"Latest client conversations with unread counts and the last message.",
			inputSchema: z.object({}),
			execute: async () => {
				const page = await listConversations(
					{ id: photographerId, role: "photographer" },
					1,
				);
				return {
					items: page.items.slice(0, 8).map((c) => ({
						id: c.id,
						clientId: c.partner.id,
						clientName: c.partner.name,
						preview: c.preview.slice(0, 160),
						lastFromMe: c.lastFromMe,
						unread: c.unread,
						at: c.lastMessageAt,
					})),
				};
			},
		}),

		team: tool({
			description:
				"The studio's collaborators: specialty, invitation status, number of projects. Use it to get a member id.",
			inputSchema: z.object({ q: z.string().max(100).optional() }),
			execute: async ({ q }) => {
				const page = await listTeamMembers(photographerId, {
					page: 1,
					q: q?.trim() ?? "",
				});
				return { items: page.items, total: page.total };
			},
		}),

		equipment: tool({
			description:
				"The studio's gear with status (active, broken, retired) and its next booking.",
			inputSchema: z.object({ q: z.string().max(100).optional() }),
			execute: async ({ q }) => {
				const page = await listEquipment(photographerId, {
					page: 1,
					q: q?.trim() ?? "",
				});
				return {
					total: page.total,
					items: page.items.map((e) => ({
						id: e.id,
						name: e.name,
						category: e.category,
						status: e.status,
						availability: e.availability,
						nextBooking: e.nextBooking,
					})),
				};
			},
		}),
	};
}
