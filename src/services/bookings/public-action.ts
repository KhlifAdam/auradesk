"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendBookingRequestEmail } from "@/lib/mail/send-client-notices";
import { sharesProjectWith } from "@/services/clients/queries";
import { emptyToNull } from "@/services/shared/schemas";
import { publicRequestSchema } from "./schemas";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_REQUESTS_PER_STUDIO_PER_HOUR = 20;
const MAX_REQUESTS_PER_EMAIL_PER_DAY = 3;

/**
 * A visitor of a public site asks for a service. It lands in the studio's
 * Bookings as a new request; it never creates a project.
 */
export async function submitBookingRequest(
	input: unknown,
): Promise<ActionResult> {
	const parsed = publicRequestSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { slug, name, phone, serviceType, desiredDate, message } = parsed.data;
	const email = parsed.data.email.toLowerCase();

	const studio = await db.studio.findUnique({
		where: { slug },
		select: {
			photographerId: true,
			name: true,
			published: true,
			bookingEnabled: true,
			photographer: { select: { email: true, locale: true, banned: true } },
		},
	});
	// A suspended studio takes no new requests.
	if (
		!studio?.published ||
		!studio.bookingEnabled ||
		studio.photographer.banned
	)
		return fail("notFound");
	const { photographerId } = studio;

	// Anonymous endpoint: cap what one studio or one address can receive.
	const now = Date.now();
	const [recentForStudio, recentFromEmail] = await Promise.all([
		db.booking.count({
			where: {
				photographerId,
				source: "WEBSITE",
				createdAt: { gt: new Date(now - HOUR_MS) },
			},
		}),
		db.booking.count({
			where: {
				photographerId,
				source: "WEBSITE",
				clientEmail: email,
				createdAt: { gt: new Date(now - DAY_MS) },
			},
		}),
	]);
	if (
		recentForStudio >= MAX_REQUESTS_PER_STUDIO_PER_HOUR ||
		recentFromEmail >= MAX_REQUESTS_PER_EMAIL_PER_DAY
	)
		return fail("tooManyRequests");

	const account = await db.user.findFirst({
		where: {
			...sharesProjectWith(photographerId),
			email: { equals: email, mode: "insensitive" },
		},
		select: { id: true },
	});
	const booking = await db.booking.create({
		data: {
			photographerId,
			clientId: account?.id ?? null,
			source: "WEBSITE",
			// The photographer can rename it once they know the occasion.
			title: name,
			clientName: name,
			clientEmail: email,
			clientPhone: emptyToNull(phone),
			serviceType,
			description: message,
			desiredDate: desiredDate ? new Date(desiredDate) : null,
			activities: { create: { kind: "CREATED" } },
		},
		select: { id: true },
	});

	sendBookingRequestEmail({
		to: studio.photographer.email,
		locale: resolveMailLocale(studio.photographer.locale),
		client: name,
		preview: message.replace(/\s+/g, " ").slice(0, 160),
		bookingId: booking.id,
	}).catch((error) =>
		console.error("Failed to send booking request email:", error),
	);

	revalidatePath("/dashboard", "layout");
	return ok();
}
