import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { getBooking, listOpenBookings } from "@/services/bookings/queries";
import { toBookingRow, toRowPage } from "./rows";

/** Booking requests and quotes: what's waiting, and one request in detail. */
export function bookingTools(photographerId: string) {
	return {
		pending_bookings: tool({
			description:
				"Booking requests still open (NEW, DISCUSSION, QUOTE_SENT), soonest date first. 20 per page.",
			inputSchema: z.object({ page: z.number().int().min(1).optional() }),
			execute: async ({ page }) =>
				toRowPage(
					await listOpenBookings(photographerId, page ?? 1),
					toBookingRow,
				),
		}),

		get_booking: tool({
			description:
				"One booking request in detail: client contact, the need, prices, whether it was sent to and accepted by the client, recent activity.",
			inputSchema: z.object({ bookingId: z.string() }),
			execute: async ({ bookingId }) => {
				const booking = await getBooking(photographerId, bookingId);
				if (!booking) return { found: false as const };
				return {
					found: true as const,
					booking: {
						...toBookingRow(booking),
						source: booking.source,
						clientEmail: booking.clientEmail,
						clientPhone: booking.clientPhone,
						description: booking.description.slice(0, 800),
						startTime: booking.startTime,
						location: booking.location,
						clientBudget: booking.clientBudget,
						plannedAdvance: booking.plannedAdvance,
						sentToClientAt: booking.sentToClientAt,
						clientAcceptedAt: booking.clientAcceptedAt,
						project: booking.project,
					},
					activity: booking.activities.slice(-5).map((a) => ({
						kind: a.kind,
						toStatus: a.toStatus,
						body: a.body.slice(0, 300),
						at: a.createdAt,
					})),
				};
			},
		}),
	};
}
