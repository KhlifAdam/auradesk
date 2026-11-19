import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { toMillimes } from "@/lib/payments/types";
import { nextPeriod } from "./period";
import { type BillingState, renewalPlan } from "./plan-change";
import { type BillingCycleId, type PlanId, pricePerPeriod } from "./plans";
import { addMonths, subscriptionState } from "./status";

type Tx = Prisma.TransactionClient;

export interface PaidPlan {
	plan: PlanId;
	cycle: BillingCycleId;
	storagePacks: number;
}

const NO_SCHEDULE = {
	scheduledPlan: null,
	scheduledCycle: null,
	scheduledStoragePacks: null,
} as const;

/** The subscription row, created if needed and locked for this transaction. */
async function lockSubscription(tx: Tx, photographerId: string) {
	await tx.subscription.upsert({
		where: { photographerId },
		create: { photographerId, trialEndsAt: addMonths(new Date(), 1) },
		update: {},
	});
	await tx.$queryRaw`SELECT id FROM subscriptions WHERE photographer_id = ${photographerId} FOR UPDATE`;
	return tx.subscription.findUniqueOrThrow({ where: { photographerId } });
}

/**
 * A period was paid: the paid plan applies now (any scheduled change is
 * done), and the subscription is extended by one period. Locks the row so
 * two payments can't overlap. Returns the period the payment covers.
 */
export async function applyPayment(
	tx: Tx,
	photographerId: string,
	paid: PaidPlan,
) {
	const current = await lockSubscription(tx, photographerId);
	const period = nextPeriod(current, paid.cycle);
	await tx.subscription.update({
		where: { photographerId },
		data: { ...paid, ...NO_SCHEDULE, paidUntil: period.periodEnd },
	});
	return period;
}

/**
 * An upgrade was paid: the pricier plan or extra storage applies now, until
 * the end of the period already paid (which doesn't move).
 */
export async function applyUpgrade(
	tx: Tx,
	photographerId: string,
	paid: PaidPlan,
) {
	const current = await lockSubscription(tx, photographerId);
	const periodStart = new Date();
	await tx.subscription.update({
		where: { photographerId },
		data: {
			plan: paid.plan,
			storagePacks: paid.storagePacks,
			...NO_SCHEDULE,
		},
	});
	return { periodStart, periodEnd: current.paidUntil ?? periodStart };
}

/**
 * Keeps the waiting renewal invoice in line with what the renewal will
 * bill, after a change was scheduled, undone or paid.
 */
export async function syncOpenInvoice(tx: Tx, photographerId: string) {
	const subscription = await tx.subscription.findUnique({
		where: { photographerId },
	});
	if (!subscription) return;
	const state: BillingState = {
		...subscription,
		...subscriptionState(subscription),
	};
	const next = renewalPlan(state);
	const period = nextPeriod(subscription, next.cycle);
	await tx.billingInvoice.updateMany({
		where: { photographerId, status: "OPEN", kind: "PERIOD" },
		data: {
			...next,
			amountMillimes: toMillimes(
				pricePerPeriod(next.plan, next.cycle, next.storagePacks),
			),
			...period,
			dueDate: period.periodStart,
		},
	});
}

/** The next AD-YYYY-NNNN number, from a counter bumped atomically. */
export async function nextBillingInvoiceNumber(tx: Tx, now = new Date()) {
	const year = now.getFullYear();
	const [row] = await tx.$queryRaw<{ last_seq: number }[]>`
		INSERT INTO billing_invoice_counters (year, last_seq) VALUES (${year}, 1)
		ON CONFLICT (year) DO UPDATE SET last_seq = billing_invoice_counters.last_seq + 1
		RETURNING last_seq`;
	return `AD-${year}-${String(row.last_seq).padStart(4, "0")}`;
}
