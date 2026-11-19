"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { toMillimes } from "@/lib/payments/types";
import { logAdminAction } from "@/services/admin/audit";
import {
	applyPayment,
	nextBillingInvoiceNumber,
	syncOpenInvoice,
} from "./apply-payment";
import { planChange, renewalPlan } from "./plan-change";
import { pricePerPeriod, STORAGE_PACK } from "./plans";
import { getSubscription } from "./queries";
import { choosePlanSchema, recordPaymentSchema } from "./schemas";

/**
 * During the free month, the photographer tries another plan (its limits
 * apply at once). A paid plan only changes through payment or a change
 * scheduled for the renewal.
 */
export async function choosePlan(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = choosePlanSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { status } = await getSubscription(photographerId);
	if (status !== "trial") return fail("planLocked");
	await db.$transaction(async (tx) => {
		await tx.subscription.update({
			where: { photographerId },
			data: parsed.data,
		});
		await syncOpenInvoice(tx, photographerId);
	});
	revalidatePath("/dashboard", "layout");
	return ok();
}

/**
 * A cheaper plan, less storage or other billing, for a paid plan: it takes
 * over at the renewal, with nothing to pay now. Picking the current plan
 * again undoes it.
 */
export async function scheduleChange(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = choosePlanSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const change = planChange(await getSubscription(photographerId), parsed.data);
	if (change.kind !== "scheduled" && change.kind !== "current")
		return fail("planLocked");
	const { plan, cycle, storagePacks } = parsed.data;
	const scheduled =
		change.kind === "scheduled"
			? {
					scheduledPlan: plan,
					scheduledCycle: cycle,
					scheduledStoragePacks: storagePacks,
				}
			: {
					scheduledPlan: null,
					scheduledCycle: null,
					scheduledStoragePacks: null,
				};
	await db.$transaction(async (tx) => {
		await tx.subscription.update({
			where: { photographerId },
			data: scheduled,
		});
		await syncOpenInvoice(tx, photographerId);
	});
	revalidatePath("/dashboard", "layout");
	return ok();
}

/**
 * An admin records a payment received outside the app: the plan is extended
 * by one period (a month, or a year), starting when the current paid period
 * or free month ends, so no paid day is lost. It is listed in the billing
 * history as a MANUAL invoice.
 */
export async function recordPayment(input: unknown): Promise<ActionResult> {
	const { session } = await requireAdmin();
	const parsed = recordPaymentSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { userId } = parsed.data;
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { role: true, deletedAt: true },
	});
	if (!user) return fail("notFound");
	if (user.deletedAt) return fail("accountDeleted");
	if (user.role !== ROLES.photographer) return fail("invalidInput");

	// The renewal's plan: a change scheduled for it takes over now.
	const { plan, cycle, storagePacks } = renewalPlan(
		await getSubscription(userId),
	);
	const amount = pricePerPeriod(plan, cycle, storagePacks);
	await db.$transaction(async (tx) => {
		const period = await applyPayment(tx, userId, {
			plan,
			cycle,
			storagePacks,
		});
		const data = {
			status: "PAID" as const,
			paidAt: new Date(),
			gateway: "MANUAL" as const,
			plan,
			cycle,
			storagePacks,
			amountMillimes: toMillimes(amount),
			...period,
		};
		// A renewal invoice already waiting is the one this payment settles.
		const open = await tx.billingInvoice.findFirst({
			where: { photographerId: userId, status: "OPEN", kind: "PERIOD" },
			orderBy: { periodStart: "asc" },
		});
		if (open) await tx.billingInvoice.update({ where: { id: open.id }, data });
		else
			await tx.billingInvoice.create({
				data: {
					...data,
					photographerId: userId,
					number: await nextBillingInvoiceNumber(tx),
				},
			});
	});

	await logAdminAction(
		session.user,
		"PAYMENT_RECORDED",
		userId,
		`${plan} · ${cycle} · +${storagePacks * STORAGE_PACK.gb} GB · ${amount} DT`,
	);
	revalidatePath("/admin", "layout");
	return ok();
}
