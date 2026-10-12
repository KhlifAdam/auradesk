"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { emptyToNull } from "@/services/shared/schemas";
import { BLOCKING_KINDS } from "./options";
import { revalidateEquipment } from "./revalidate";
import { bookingRefSchema, equipmentBookingSchema } from "./schemas";

/**
 * Books an item for a period. A blocking booking can't overlap another one
 * of the same item (unless that one came back before this starts).
 */
export async function createEquipmentBooking(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = equipmentBookingSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { equipmentId, projectId, kind, ...values } = parsed.data;
	const startDate = new Date(values.startDate);
	const endDate = new Date(values.endDate);

	const error = await db.$transaction(async (tx) => {
		// The row lock keeps two overlapping bookings from both getting in.
		await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${equipmentId} AND photographer_id = ${photographerId} FOR UPDATE`;
		const item = await tx.equipment.findFirst({
			where: { id: equipmentId, photographerId },
			select: { status: true },
		});
		if (!item) return "notFound";
		if (item.status !== "ACTIVE") return "equipmentUnavailable";

		const project =
			kind === "PROJECT"
				? await tx.project.findFirst({
						where: { id: projectId, photographerId },
						select: { id: true },
					})
				: null;
		if (kind === "PROJECT" && !project) return "notFound";

		const blocking = (BLOCKING_KINDS as readonly string[]).includes(kind);
		const clash =
			blocking &&
			(await tx.equipmentBooking.count({
				where: {
					equipmentId,
					kind: { in: [...BLOCKING_KINDS] },
					startDate: { lte: endDate },
					endDate: { gte: startDate },
					OR: [{ returnedAt: null }, { returnedAt: { gt: startDate } }],
				},
			}));
		if (clash) return "equipmentConflict";

		await tx.equipmentBooking.create({
			data: {
				photographerId,
				equipmentId,
				projectId: project?.id ?? null,
				kind,
				startDate,
				endDate,
				partyName: kind === "PROJECT" ? null : emptyToNull(values.partyName),
				amount: values.amount,
				notes: emptyToNull(values.notes),
			},
		});
		return null;
	});
	if (error) return fail(error);

	revalidateEquipment();
	return ok();
}

/** The item came back (early or on time): it's free again from now. */
export async function markEquipmentReturned(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = bookingRefSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.equipmentBooking.updateMany({
		where: {
			id: parsed.data.bookingId,
			equipmentId: parsed.data.equipmentId,
			photographerId,
			returnedAt: null,
		},
		data: { returnedAt: new Date() },
	});
	if (count === 0) return fail("notFound");

	revalidateEquipment();
	return ok();
}

export async function deleteEquipmentBooking(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = bookingRefSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.equipmentBooking.deleteMany({
		where: {
			id: parsed.data.bookingId,
			equipmentId: parsed.data.equipmentId,
			photographerId,
		},
	});
	if (count === 0) return fail("notFound");

	revalidateEquipment();
	return ok();
}
