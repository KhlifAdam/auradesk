"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { syncOpenInvoice } from "./apply-payment";
import { openCheckout } from "./checkout";
import { canRenewNow, planChange, renewalPlan } from "./plan-change";
import { pricePerPeriod } from "./plans";
import { getSubscription } from "./queries";
import { choosePlanSchema } from "./schemas";

type PayUrl = ActionResult<{ payUrl: string }>;

async function open(...args: Parameters<typeof openCheckout>): Promise<PayUrl> {
	try {
		return ok({ payUrl: await openCheckout(...args) });
	} catch (error) {
		console.error("[billing] could not open a payment", error);
		return fail("paymentUnavailable");
	}
}

/**
 * Pays for the plan picked on the page: a first period (free month or
 * ended plan), or an upgrade of the paid plan for the days left. Anything
 * else has nothing to pay now. The amount is always worked out here.
 */
export async function startCheckout(input: unknown): Promise<PayUrl> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = choosePlanSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const change = planChange(await getSubscription(photographerId), parsed.data);
	if (change.kind === "subscribe")
		return open(session.user, parsed.data, {
			kind: "PERIOD",
			amount: change.amount,
		});
	if (change.kind === "upgrade")
		return open(session.user, parsed.data, {
			kind: "UPGRADE",
			amount: change.amount,
		});
	return fail("nothingToPay");
}

/**
 * Pays the next period (the scheduled change, if any), through the renewal
 * invoice when one is waiting. Only once the renewal is due, so periods
 * can't be stacked.
 */
export async function renewSubscription(): Promise<PayUrl> {
	const { session, photographerId } = await requirePhotographer();
	const subscription = await getSubscription(photographerId);
	if (!canRenewNow(subscription)) return fail("renewalNotDue");

	const next = renewalPlan(subscription);
	await db.$transaction((tx) => syncOpenInvoice(tx, photographerId));
	const invoice = await db.billingInvoice.findFirst({
		where: { photographerId, status: "OPEN", kind: "PERIOD" },
		orderBy: { periodStart: "asc" },
		select: { id: true },
	});
	return open(session.user, next, {
		kind: "PERIOD",
		amount: pricePerPeriod(next.plan, next.cycle, next.storagePacks),
		invoiceId: invoice?.id ?? null,
	});
}
