"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { revalidatePublicSites } from "@/lib/public-site/cache";
import { ownsMedia } from "@/services/shared/assert-owned-media";
import { lockPhotographer } from "@/services/shared/lock-rows";
import { pageSkip } from "@/services/shared/pagination";
import {
	pageReorderSchema,
	planPageReorder,
} from "@/services/shared/reorder-page";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import {
	MAX_PACKAGES,
	PACKAGE_PAGE_SIZE,
	type PackageValues,
	packageSchema,
	updatePackageSchema,
} from "./schemas";

const SERVICES_PATH = "/dashboard/services";

function revalidateServices() {
	revalidatePath(SERVICES_PATH);
	revalidatePublicSites();
}

function toData({ description, ...values }: PackageValues) {
	return {
		...values,
		description: emptyToNull(description),
		// "Unlimited" replaces the amount.
		durationMinutes: values.unlimitedDuration ? null : values.durationMinutes,
		photoCount: values.unlimitedPhotos ? null : values.photoCount,
	};
}

export async function createPackage(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = packageSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	if (!(await ownsMedia(photographerId, [parsed.data.coverMediaId])))
		return fail("invalidInput");

	const created = await db.$transaction(async (tx) => {
		await lockPhotographer(tx, photographerId);
		if ((await tx.package.count({ where: { photographerId } })) >= MAX_PACKAGES)
			return false;

		const { _max } = await tx.package.aggregate({
			where: { photographerId },
			_max: { position: true },
		});
		await tx.package.create({
			data: {
				...toData(parsed.data),
				photographerId,
				position: (_max.position ?? -1) + 1,
			},
		});
		return true;
	});
	if (!created) return fail("packageLimit");

	revalidateServices();
	return ok();
}

export async function updatePackage(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = updatePackageSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { id, ...values } = parsed.data;
	if (!(await ownsMedia(photographerId, [values.coverMediaId])))
		return fail("invalidInput");

	const { count } = await db.package.updateMany({
		where: { id, photographerId },
		data: toData(values),
	});
	if (count === 0) return fail("notFound");
	revalidateServices();
	return ok();
}

export async function deletePackage(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const id = idSchema.parse(input);
	const { count } = await db.package.deleteMany({
		where: { id, photographerId },
	});
	if (count === 0) return fail("notFound");
	revalidateServices();
	return ok();
}

export async function reorderPackages(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = pageReorderSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { page, ids } = parsed.data;

	const reordered = await db.$transaction(async (tx) => {
		await lockPhotographer(tx, photographerId);
		const current = await tx.package.findMany({
			where: { photographerId },
			orderBy: [{ position: "asc" }, { id: "asc" }],
			skip: pageSkip(page, PACKAGE_PAGE_SIZE),
			take: PACKAGE_PAGE_SIZE,
			select: { id: true, position: true },
		});
		const next = planPageReorder(current, ids);
		if (!next) return false;
		for (const { id, position } of next) {
			await tx.package.update({ where: { id }, data: { position } });
		}
		return true;
	});
	if (!reordered) return fail("staleOrder");

	revalidateServices();
	return ok();
}
