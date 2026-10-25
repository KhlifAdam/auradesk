import "server-only";

import { db } from "@/lib/db";
import { getActiveEstimates } from "@/services/projects/estimate";
import type { Reminder } from "./reminders";

const PER_RULE = 3;

/**
 * Looking ahead: projects the smart estimate says will miss their deadline,
 * and printed photo books to cash when they are handed over.
 */
export async function planningReminders(
	photographerId: string,
	today: Date,
): Promise<Reminder[]> {
	const todayKey = today.toISOString().slice(0, 10);
	const [estimates, books] = await Promise.all([
		getActiveEstimates(photographerId),
		db.photoBook.findMany({
			where: {
				photographerId,
				status: { in: ["READY", "DELIVERED"] },
				invoice: { status: "SENT" },
			},
			select: {
				id: true,
				title: true,
				status: true,
				client: { select: { name: true } },
			},
			orderBy: { updatedAt: "asc" },
			take: PER_RULE,
		}),
	]);

	// Deadlines already passed are told by the deadline rule.
	const atRisk = estimates
		.filter(
			({ estimate }) =>
				estimate.deadline?.status === "late" &&
				estimate.deadline.date >= todayKey,
		)
		.slice(0, PER_RULE)
		.map(
			({ projectId, title, estimate }): Reminder => ({
				kind: "deadlineAtRisk",
				urgent: false,
				href: `/dashboard/projects/${projectId}`,
				values: {
					project: title,
					days: Math.abs(estimate.deadline?.slackDays ?? 0),
				},
			}),
		);

	const toCollect = books.map(
		(book): Reminder => ({
			kind: book.status === "DELIVERED" ? "bookUnpaid" : "bookToCollect",
			urgent: book.status === "DELIVERED",
			href: `/dashboard/books/${book.id}`,
			values: { book: book.title, client: book.client.name },
		}),
	);

	return [...atRisk, ...toCollect];
}
