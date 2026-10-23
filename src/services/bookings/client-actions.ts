"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import {
	type BookingReplyKind,
	sendBookingClientReplyEmail,
} from "@/lib/mail/send-client-notices";
import { toE164 } from "@/lib/phone";
import { clientBookingWhere } from "@/services/portal/booking-queries";
import { emptyToNull } from "@/services/shared/schemas";
import { bookingCompleteness } from "./completeness";
import { isOpenStatus } from "./options";
import { clientAnswerSchema, clientEditSchema } from "./schemas";

/** The request, if it was sent to this client and is still theirs to answer. */
async function findOpenBooking(
	user: Parameters<typeof clientBookingWhere>[0],
	id: string,
) {
	const booking = await db.booking.findFirst({
		where: { id, ...clientBookingWhere(user) },
		include: { photographer: { select: { email: true, locale: true } } },
	});
	if (!booking) return { booking: null, error: "notFound" as const };
	if (!isOpenStatus(booking.status) || booking.clientAcceptedAt)
		return { booking: null, error: "bookingLocked" as const };
	return { booking, error: null };
}

/** Tells the photographer what the client just did; a failure never blocks it. */
function notifyPhotographer(
	booking: {
		id: string;
		title: string;
		clientName: string;
		photographer: { email: string; locale: string | null };
	},
	kind: BookingReplyKind,
) {
	sendBookingClientReplyEmail({
		to: booking.photographer.email,
		locale: resolveMailLocale(booking.photographer.locale),
		client: booking.clientName,
		booking: booking.title,
		kind,
		bookingId: booking.id,
	}).catch((error) =>
		console.error(
			"Failed to notify the photographer of a client reply:",
			error,
		),
	);
}

function revalidate() {
	revalidatePath("/dashboard", "layout");
	revalidatePath("/portal", "layout");
}

/** Fields of the request the client changed, compared with what was stored. */
function changedFields(
	current: Record<string, unknown>,
	next: Record<string, unknown>,
) {
	return Object.keys(next).filter((key) => current[key] !== next[key]);
}

/** The client fills in or corrects their part: contact, need, date, place… */
export async function updateBookingAsClient(
	input: unknown,
): Promise<ActionResult> {
	const { session, clientId } = await requireClient();
	const parsed = clientEditSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, durationHours, ...values } = parsed.data;

	const found = await findOpenBooking(session.user, id);
	if (!found.booking) return fail(found.error);
	const { booking } = found;

	const next = {
		clientName: values.clientName,
		// Stored as E.164 once it parses, like the photographer's form does.
		clientPhone: emptyToNull(toE164(values.clientPhone) ?? values.clientPhone),
		serviceType: values.serviceType,
		mediaType: values.mediaType,
		description: emptyToNull(values.description),
		desiredDate: values.desiredDate
			? new Date(values.desiredDate).toISOString()
			: null,
		startTime: emptyToNull(values.startTime),
		durationMinutes: durationHours ? Math.round(durationHours * 60) : null,
		location: emptyToNull(values.location),
		clientBudget: values.clientBudget,
	};
	const changed = changedFields(
		{
			clientName: booking.clientName,
			clientPhone: booking.clientPhone,
			serviceType: booking.serviceType,
			mediaType: booking.mediaType,
			description: booking.description,
			desiredDate: booking.desiredDate?.toISOString() ?? null,
			startTime: booking.startTime,
			durationMinutes: booking.durationMinutes,
			location: booking.location,
			clientBudget: booking.clientBudget?.toNumber() ?? null,
		},
		next,
	);
	if (changed.length === 0) return ok();

	await db.$transaction([
		db.booking.update({
			where: { id },
			data: {
				...next,
				desiredDate: next.desiredDate ? new Date(next.desiredDate) : null,
				// The first time they save, their account is linked: they keep
				// access even after changing the phone number it was sent to.
				clientId: booking.clientId ?? clientId,
			},
		}),
		db.bookingActivity.create({
			data: { bookingId: id, kind: "CLIENT_EDIT", body: changed.join(",") },
		}),
	]);

	notifyPhotographer(booking, "updated");
	revalidate();
	return ok();
}

/** The client accepts the proposal, or declines the request. */
export async function answerBooking(input: unknown): Promise<ActionResult> {
	const { session, clientId } = await requireClient();
	const parsed = clientAnswerSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { id, accept, reason } = parsed.data;

	const found = await findOpenBooking(session.user, id);
	if (!found.booking) return fail(found.error);
	const { booking } = found;

	if (accept) {
		// Accepting a proposal that has no date or price yet would mean nothing.
		if (bookingCompleteness(booking).required.length > 0)
			return fail("bookingIncomplete");
		await db.$transaction([
			db.booking.update({
				where: { id },
				data: {
					clientAcceptedAt: new Date(),
					clientId: booking.clientId ?? clientId,
				},
			}),
			db.bookingActivity.create({
				data: { bookingId: id, kind: "CLIENT_ACCEPT" },
			}),
		]);
	} else {
		await db.$transaction([
			db.booking.update({
				where: { id },
				data: {
					status: "DECLINED",
					statusReason: emptyToNull(reason),
					clientId: booking.clientId ?? clientId,
				},
			}),
			db.bookingActivity.create({
				data: {
					bookingId: id,
					kind: "CLIENT_DECLINE",
					fromStatus: booking.status,
					toStatus: "DECLINED",
					body: emptyToNull(reason),
				},
			}),
		]);
	}

	notifyPhotographer(booking, accept ? "accepted" : "declined");
	revalidate();
	return ok();
}
