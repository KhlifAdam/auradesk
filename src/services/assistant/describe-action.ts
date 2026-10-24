"use server";

import { z } from "zod";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { sharesProjectWith } from "@/services/clients/queries";
import type { ActionTarget } from "./types";

/** The ids an assistant action can point at; each is looked up separately. */
const targetsSchema = z.object({
	bookingId: z.string().max(64).optional(),
	invoiceId: z.string().max(64).optional(),
	galleryId: z.string().max(64).optional(),
	projectId: z.string().max(64).optional(),
	clientId: z.string().max(64).optional(),
	eventId: z.string().max(64).optional(),
	memberId: z.string().max(64).optional(),
});

type Lookup = (
	photographerId: string,
	id: string,
) => Promise<ActionTarget | null>;

const day = (date: Date | null) => date?.toISOString().slice(0, 10) ?? "";

const LOOKUPS: Record<keyof z.infer<typeof targetsSchema>, Lookup> = {
	bookingId: async (photographerId, id) => {
		const row = await db.booking.findFirst({
			where: { id, photographerId },
			select: { title: true, clientName: true, desiredDate: true },
		});
		return (
			row && {
				title: row.title || row.clientName,
				subtitle: [row.clientName, day(row.desiredDate)]
					.filter(Boolean)
					.join(" · "),
				href: `/dashboard/bookings/${id}`,
			}
		);
	},
	invoiceId: async (photographerId, id) => {
		const row = await db.invoice.findFirst({
			where: { id, photographerId },
			select: { number: true, clientName: true, status: true },
		});
		return (
			row && {
				title: row.number,
				subtitle: row.clientName,
				href: `/dashboard/invoices/${id}`,
			}
		);
	},
	galleryId: async (photographerId, id) => {
		const row = await db.gallery.findFirst({
			where: { id, photographerId },
			select: { title: true, project: { select: { id: true, title: true } } },
		});
		return (
			row && {
				title: row.title,
				subtitle: row.project.title,
				href: `/dashboard/projects/${row.project.id}`,
			}
		);
	},
	projectId: async (photographerId, id) => {
		const row = await db.project.findFirst({
			where: { id, photographerId },
			select: {
				title: true,
				eventDate: true,
				client: { select: { name: true } },
			},
		});
		return (
			row && {
				title: row.title,
				subtitle: [row.client?.name, day(row.eventDate)]
					.filter(Boolean)
					.join(" · "),
				href: `/dashboard/projects/${id}`,
			}
		);
	},
	clientId: async (photographerId, id) => {
		const row = await db.user.findFirst({
			where: { id, ...sharesProjectWith(photographerId) },
			select: { name: true },
		});
		return (
			row && { title: row.name, subtitle: "", href: `/dashboard/clients/${id}` }
		);
	},
	eventId: async (photographerId, id) => {
		const row = await db.calendarEvent.findFirst({
			where: { id, photographerId },
			select: { title: true, type: true, startsAt: true },
		});
		return (
			row && {
				title: row.title || row.type,
				subtitle: day(row.startsAt),
				href: "/dashboard/calendar",
			}
		);
	},
	memberId: async (photographerId, id) => {
		const row = await db.teamMember.findFirst({
			where: { id, photographerId },
			select: { name: true, specialty: true },
		});
		return (
			row && {
				title: row.name,
				subtitle: row.specialty ?? "",
				href: "/dashboard/team",
			}
		);
	},
};

/**
 * What an action card is about, read from the database rather than from the
 * model, so the user confirms the real record. Null when an id isn't theirs.
 */
export async function describeActionTargets(
	input: unknown,
): Promise<ActionTarget[] | null> {
	const { photographerId } = await requirePhotographer();
	const parsed = targetsSchema.safeParse(input);
	if (!parsed.success) return null;
	const entries = Object.entries(parsed.data).filter(
		(entry): entry is [keyof typeof LOOKUPS, string] => Boolean(entry[1]),
	);
	const targets = await Promise.all(
		entries.map(([key, id]) => LOOKUPS[key](photographerId, id)),
	);
	return targets.every(Boolean) ? (targets as ActionTarget[]) : null;
}
