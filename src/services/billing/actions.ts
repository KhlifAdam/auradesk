"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { logAdminAction } from "@/services/admin/audit";
import { pricePerPeriod } from "./plans";
import { getSubscription } from "./queries";
import { choosePlanSchema, recordPaymentSchema } from "./schemas";
import { addMonths } from "./status";

/** The photographer picks the plan and billing they will pay for. */
export async function choosePlan(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = choosePlanSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	await getSubscription(photographerId);
	await db.subscription.update({
		where: { photographerId },
		data: parsed.data,
	});
	revalidatePath("/dashboard", "layout");
	return ok();
}

/**
 * An admin records a payment received outside the app: the plan is extended
 * by one period (a month, or a year), starting when the current paid period
 * or free month ends, so no paid day is lost.
 */
export async function recordPayment(input: unknown): Promise<ActionResult> {
	const { session } = await requireAdmin();
	const parsed = recordPaymentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { userId } = parsed.data;
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});
	if (!user) return fail("notFound");
	if (user.role !== ROLES.photographer) return fail("invalidInput");

	const current = await getSubscription(userId);
	const start = new Date(
		Math.max(
			Date.now(),
			current.trialEndsAt.getTime(),
			current.paidUntil?.getTime() ?? 0,
		),
	);
	const months = current.cycle === "YEARLY" ? 12 : 1;
	await db.subscription.update({
		where: { photographerId: userId },
		data: { paidUntil: addMonths(start, months) },
	});

	const amount = pricePerPeriod(current.plan, current.cycle);
	await logAdminAction(
		session.user,
		"PAYMENT_RECORDED",
		userId,
		`${current.plan} · ${current.cycle} · ${amount} DT`,
	);
	revalidatePath("/admin", "layout");
	return ok();
}
