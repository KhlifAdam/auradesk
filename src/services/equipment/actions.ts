"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { revalidateEquipment } from "./revalidate";
import {
	type EquipmentValues,
	equipmentSchema,
	updateEquipmentSchema,
} from "./schemas";

const toDate = (value: string) => (value ? new Date(value) : null);

function toData(values: EquipmentValues) {
	return {
		name: values.name,
		category: values.category,
		brand: emptyToNull(values.brand),
		model: emptyToNull(values.model),
		serialNumber: emptyToNull(values.serialNumber),
		status: values.status,
		ownership: values.ownership,
		purchaseDate: toDate(values.purchaseDate),
		purchasePrice: values.purchasePrice,
		dailyRate: values.dailyRate,
		notes: emptyToNull(values.notes),
	};
}

export async function createEquipment(
	input: unknown,
): Promise<ActionResult<{ id: string }>> {
	const { photographerId } = await requirePhotographer();
	const parsed = equipmentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const item = await db.equipment.create({
		data: { photographerId, ...toData(parsed.data) },
		select: { id: true },
	});

	revalidateEquipment();
	return ok(item);
}

export async function updateEquipment(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updateEquipmentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, ...values } = parsed.data;
	const { count } = await db.equipment.updateMany({
		where: { id, photographerId },
		data: toData(values),
	});
	if (count === 0) return fail("notFound");

	revalidateEquipment();
	return ok();
}

/** Removes the item and its booking history. */
export async function deleteEquipment(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.equipment.deleteMany({
		where: { id: parsed.data, photographerId },
	});
	if (count === 0) return fail("notFound");

	revalidateEquipment();
	return ok();
}
