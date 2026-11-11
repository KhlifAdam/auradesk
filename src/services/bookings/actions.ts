"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { flagBookingForClient } from "@/services/changes/flag";
import { sharesProjectWith } from "@/services/clients/queries";
import { computeTotals } from "@/services/invoices/totals";
import { CLIENT_SOURCES } from "@/services/portal/booking-queries";
import { emptyToNull, idSchema, isTooEarly } from "@/services/shared/schemas";
import { saveBookingQuote } from "./booking-quote";
import { canSaveBooking } from "./completeness";
import {
	type BookingValues,
	bookingSchema,
	updateBookingSchema,
} from "./schemas";

const toDate = (value: string) => (value ? new Date(value) : null);

/** The typed title, else "Wedding · Ahmed Ben Ali" from the type and client. */
async function titleOf(values: Omit<BookingValues, "clientId">) {
	if (values.title) return values.title;
	const tService = await getTranslations("Projects.serviceTypes");
	return `${tService(values.serviceType)} · ${values.clientName}`;
}

async function toData(values: Omit<BookingValues, "clientId">) {
	return {
		title: await titleOf(values),
		source: values.source,
		clientName: values.clientName,
		clientEmail: values.clientEmail ? values.clientEmail.toLowerCase() : null,
		// Stored as E.164 once it parses, so it matches a client's account.
		clientPhone: emptyToNull(toE164(values.clientPhone) ?? values.clientPhone),
		serviceType: values.serviceType,
		mediaType: values.mediaType,
		description: emptyToNull(values.description),
		desiredDate: toDate(values.desiredDate),
		startTime: emptyToNull(values.startTime),
		durationMinutes: values.durationHours
			? Math.round(values.durationHours * 60)
			: null,
		location: emptyToNull(values.location),
		clientBudget: values.clientBudget,
		// The quote's total, whatever the browser sent.
		proposedPrice: computeTotals(values.items, values.discount, values.taxRate)
			.total,
		plannedAdvance: values.plannedAdvance,
		responseDeadline: toDate(values.responseDeadline),
		internalNotes: emptyToNull(values.internalNotes),
	};
}

/**
 * Links the booking to an existing client account: the one picked, else the
 * one that owns the email or the phone number. Only the photographer's own
 * clients qualify.
 */
async function resolveClientId(
	photographerId: string,
	clientId: string,
	email: string,
	phone: string,
) {
	const e164 = toE164(phone);
	// The email is what the form shows, so it wins over a stale picked id.
	const identity = email
		? { email: { equals: email, mode: "insensitive" as const } }
		: e164
			? { phoneNumber: e164 }
			: clientId
				? { id: clientId }
				: null;
	if (!identity) return null;
	const match = await db.user.findFirst({
		where: { ...sharesProjectWith(photographerId), ...identity },
		select: { id: true },
	});
	return match?.id ?? null;
}

/** The booking and the lists that show it. */
function revalidateBookings() {
	revalidatePath("/dashboard", "layout");
}

export async function createBooking(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = bookingSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	if (!canSaveBooking(parsed.data)) return fail("bookingNeedsContact");

	const { clientId, ...values } = parsed.data;
	const booking = await db.booking.create({
		data: {
			photographerId,
			clientId: await resolveClientId(
				photographerId,
				clientId,
				values.clientEmail,
				values.clientPhone,
			),
			...(await toData(values)),
			activities: { create: { kind: "CREATED" } },
		},
		select: { id: true },
	});

	// The booking's costs are its quote, made with it.
	const quote = await saveBookingQuote(photographerId, booking.id, values);
	if (!quote.ok) {
		await db.booking.delete({ where: { id: booking.id } });
		return fail(quote.error);
	}

	revalidateBookings();
	return ok(booking);
}

export async function updateBooking(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateBookingSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	if (!canSaveBooking(parsed.data)) return fail("bookingNeedsContact");

	const { id, clientId, ...values } = parsed.data;
	const stored = await db.booking.findFirst({
		where: { id, photographerId },
		select: { desiredDate: true, status: true, source: true },
	});
	const storedDate = stored?.desiredDate?.toISOString().slice(0, 10) ?? "";
	if (values.desiredDate !== storedDate && isTooEarly(values.desiredDate))
		return fail("dateTooEarly");
	const { count } = await db.booking.updateMany({
		where: { id, photographerId, status: { not: "CONFIRMED" } },
		data: {
			clientId: await resolveClientId(
				photographerId,
				clientId,
				values.clientEmail,
				values.clientPhone,
			),
			...(await toData(values)),
			// New terms need a new answer from the client.
			clientAcceptedAt: null,
			// Answering a request the client sent moves it into discussion.
			...(stored?.status === "NEW" &&
				(CLIENT_SOURCES as readonly string[]).includes(stored.source) && {
					status: "DISCUSSION" as const,
				}),
		},
	});
	if (count === 0) return fail(await whyNotEditable(photographerId, id));

	const quote = await saveBookingQuote(photographerId, id, values);
	if (!quote.ok) return fail(quote.error);

	await flagBookingForClient(id);
	revalidateBookings();
	return ok();
}

/** A confirmed booking is locked: its project now carries the details. */
async function whyNotEditable(photographerId: string, id: string) {
	const exists = await db.booking.count({ where: { id, photographerId } });
	return exists ? "bookingLocked" : "notFound";
}

export async function deleteBooking(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.booking.deleteMany({
		where: { id: parsed.data, photographerId },
	});
	if (count === 0) return fail("notFound");

	revalidateBookings();
	return ok();
}
