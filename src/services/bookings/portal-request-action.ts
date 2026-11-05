"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendBookingRequestEmail } from "@/lib/mail/send-client-notices";
import { realEmail } from "@/lib/phone";
import { flagBookingForStudio } from "@/services/changes/flag";
import { listClientStudios } from "@/services/portal/home-queries";
import { emptyToNull } from "@/services/shared/schemas";
import { portalRequestSchema } from "./schemas";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_DAY = 5;

/**
 * A client asks a studio they already work with for a new service. It lands
 * in that studio's Bookings as a new request, and in the client's own list.
 */
export async function requestBookingFromPortal(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { session, clientId } = await requireClient();
	const parsed = portalRequestSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const {
		photographerId,
		serviceType,
		mediaType,
		desiredDate,
		startTime,
		durationHours,
		location,
		clientBudget,
		plannedAdvance,
		message,
	} = parsed.data;
	const { user } = session;

	const studios = await listClientStudios(user);
	if (!studios.some((studio) => studio.photographerId === photographerId))
		return fail("notFound");

	const recent = await db.booking.count({
		where: {
			clientId,
			source: "PORTAL",
			createdAt: { gt: new Date(Date.now() - DAY_MS) },
		},
	});
	if (recent >= MAX_REQUESTS_PER_DAY) return fail("tooManyRequests");

	const tService = await getTranslations("Projects.serviceTypes");
	const now = new Date();
	const booking = await db.booking.create({
		data: {
			photographerId,
			clientId,
			source: "PORTAL",
			title: `${tService(serviceType)} · ${user.name}`,
			clientName: user.name,
			clientEmail: realEmail(user.email),
			clientPhone: user.phoneNumber ?? null,
			serviceType,
			mediaType,
			description: message,
			desiredDate: desiredDate ? new Date(desiredDate) : null,
			startTime: emptyToNull(startTime),
			durationMinutes: durationHours ? Math.round(durationHours * 60) : null,
			location: emptyToNull(location),
			clientBudget,
			plannedAdvance,
			// Theirs from the start: it shows in their space right away.
			sentToClientAt: now,
			clientSeenAt: now,
			activities: { create: { kind: "CREATED" } },
		},
		select: {
			id: true,
			photographer: { select: { email: true, locale: true } },
		},
	});

	sendBookingRequestEmail({
		to: booking.photographer.email,
		locale: resolveMailLocale(booking.photographer.locale),
		client: user.name,
		preview: message.replace(/\s+/g, " ").slice(0, 160),
		bookingId: booking.id,
	}).catch((error) =>
		console.error("Failed to send booking request email:", error),
	);

	// New for the studio (their email is above); already seen by the client.
	await flagBookingForStudio(booking.id, { text: true });
	revalidatePath("/portal", "layout");
	revalidatePath("/dashboard", "layout");
	return ok({ id: booking.id });
}
