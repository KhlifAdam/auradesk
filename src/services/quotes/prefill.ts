import "server-only";

import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import type { QuoteValues } from "./schemas";

/** A new quote for a booking: its client and one line at the proposed price. */
export async function quotePrefillFromBooking(
	photographerId: string,
	bookingId: string,
): Promise<{ values: Partial<QuoteValues>; bookingTitle: string } | null> {
	const booking = await db.booking.findFirst({
		where: { id: bookingId, photographerId },
		select: {
			id: true,
			title: true,
			serviceType: true,
			proposedPrice: true,
			clientName: true,
			clientEmail: true,
			clientPhone: true,
			projectId: true,
			client: { select: { id: true, name: true, email: true } },
		},
	});
	if (!booking) return null;

	const tService = await getTranslations("Projects.serviceTypes");
	const { client } = booking;
	const values: Partial<QuoteValues> = {
		bookingId: booking.id,
		projectId: booking.projectId ?? "",
		clientId: client?.id ?? "",
		clientName: booking.clientName || client?.name || "",
		clientEmail:
			booking.clientEmail || (client && realEmail(client.email)) || "",
		clientPhone: booking.clientPhone ?? "",
		items: [
			{
				description: `${tService(booking.serviceType)} · ${booking.title}`,
				quantity: 1,
				unitPrice: booking.proposedPrice?.toNumber() ?? null,
			},
		],
	};
	return { values, bookingTitle: booking.title };
}
