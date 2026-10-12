"use server";

import { type ActionResult, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { searchQuerySchema } from "@/services/clients/schemas";
import type { PickerOption } from "@/services/shared/picker";

const PICKER_LIMIT = 8;

/** Bookable items (active ones) matching `q`, for pickers. */
export async function findMyEquipment(
	input: unknown,
): Promise<ActionResult<PickerOption[]>> {
	const { photographerId } = await requirePhotographer();
	const parsed = searchQuerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const q = parsed.data;
	const rows = await db.equipment.findMany({
		where: {
			photographerId,
			status: "ACTIVE",
			...(q && {
				OR: [
					{ name: { contains: q, mode: "insensitive" } },
					{ brand: { contains: q, mode: "insensitive" } },
					{ model: { contains: q, mode: "insensitive" } },
				],
			}),
		},
		select: { id: true, name: true, brand: true, model: true },
		orderBy: [{ name: "asc" }, { id: "asc" }],
		take: PICKER_LIMIT,
	});
	return ok(
		rows.map((row) => ({
			id: row.id,
			label: row.name,
			detail: [row.brand, row.model].filter(Boolean).join(" "),
		})),
	);
}

/** The photographer's projects matching `q`, newest first, for pickers. */
export async function findMyProjects(
	input: unknown,
): Promise<ActionResult<PickerOption[]>> {
	const { photographerId } = await requirePhotographer();
	const parsed = searchQuerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const q = parsed.data;
	const rows = await db.project.findMany({
		where: {
			photographerId,
			...(q && { title: { contains: q, mode: "insensitive" } }),
		},
		select: { id: true, title: true, eventDate: true },
		orderBy: [{ createdAt: "desc" }, { id: "asc" }],
		take: PICKER_LIMIT,
	});
	return ok(
		rows.map((row) => ({
			id: row.id,
			label: row.title,
			detail: row.eventDate?.toISOString().slice(0, 10) ?? "",
		})),
	);
}
