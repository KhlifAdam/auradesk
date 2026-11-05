"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { flagBookingForClient } from "@/services/changes/flag";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { declineSchema, setStatusSchema } from "./schemas";

/** The booking and the lists that show it. */
function revalidateBookings() {
	revalidatePath("/dashboard", "layout");
}

/** Moves an open request along: new → in discussion → quote sent (or back). */
export async function setBookingStatus(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = setStatusSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, status } = parsed.data;
	const booking = await db.booking.findFirst({
		where: { id, photographerId },
		select: { status: true },
	});
	if (!booking) return fail("notFound");
	if (booking.status === "CONFIRMED") return fail("bookingLocked");
	if (booking.status === status) return ok();

	await db.$transaction([
		db.booking.update({
			where: { id },
			data: { status, statusReason: null },
		}),
		db.bookingActivity.create({
			data: {
				bookingId: id,
				kind: "STATUS",
				fromStatus: booking.status,
				toStatus: status,
			},
		}),
	]);

	await flagBookingForClient(id);
	revalidateBookings();
	return ok();
}

/** Declines a request or cancels a confirmed booking, with an optional reason. */
export async function declineBooking(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = declineSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, reason } = parsed.data;
	const booking = await db.booking.findFirst({
		where: { id, photographerId },
		select: { status: true },
	});
	if (!booking) return fail("notFound");
	if (booking.status === "DECLINED") return ok();

	await db.$transaction([
		db.booking.update({
			where: { id },
			data: { status: "DECLINED", statusReason: emptyToNull(reason) },
		}),
		db.bookingActivity.create({
			data: {
				bookingId: id,
				kind: "STATUS",
				fromStatus: booking.status,
				toStatus: "DECLINED",
				body: emptyToNull(reason),
			},
		}),
	]);

	await flagBookingForClient(id);
	revalidateBookings();
	return ok();
}

/** Reopens a declined request as a new discussion. */
export async function reopenBooking(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const booking = await db.booking.findFirst({
		where: { id: parsed.data, photographerId },
		select: { status: true, projectId: true },
	});
	if (!booking) return fail("notFound");
	// A cancelled booking whose project exists stays closed: the project lives on.
	if (booking.status !== "DECLINED" || booking.projectId)
		return fail("bookingLocked");

	await db.$transaction([
		db.booking.update({
			where: { id: parsed.data },
			data: { status: "DISCUSSION", statusReason: null },
		}),
		db.bookingActivity.create({
			data: {
				bookingId: parsed.data,
				kind: "STATUS",
				fromStatus: "DECLINED",
				toStatus: "DISCUSSION",
			},
		}),
	]);

	await flagBookingForClient(parsed.data);
	revalidateBookings();
	return ok();
}
