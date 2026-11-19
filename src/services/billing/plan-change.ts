import { monthsIn } from "./period";
import { type BillingCycleId, type PlanId, pricePerPeriod } from "./plans";
import { REMINDER_DAYS, type SubscriptionStatus } from "./status";

/**
 * What changing the plan means, in one place for the page and the server:
 *
 * - Free month or ended: Subscribe pays a period of the chosen plan.
 * - Paid: a pricier plan or more storage (same billing) is an upgrade, paid
 *   now for the days left and applied at once. Anything cheaper, or a switch
 *   between monthly and yearly, waits for the renewal, with nothing to pay.
 * - Renewing is only possible in the last REMINDER_DAYS (or once over), so
 *   periods can't be stacked by clicking again.
 */

export interface PlanChoice {
	plan: PlanId;
	cycle: BillingCycleId;
	storagePacks: number;
}

export interface BillingState extends PlanChoice {
	status: SubscriptionStatus;
	trialEndsAt: Date;
	paidUntil: Date | null;
	endsAt: Date | null;
	scheduledPlan: PlanId | null;
	scheduledCycle: BillingCycleId | null;
	scheduledStoragePacks: number | null;
}

export type PlanChange =
	| { kind: "current" }
	| { kind: "subscribe"; amount: number; startsAt: Date }
	| {
			kind: "upgrade";
			amount: number;
			/** What the change adds to a month's price. */
			perMonth: number;
			until: Date;
			days: number;
	  }
	| { kind: "scheduled"; from: Date };

const DAY_MS = 24 * 60 * 60 * 1000;
const AVERAGE_MONTH_MS = (365.25 / 12) * DAY_MS;

export const samePlan = (a: PlanChoice, b: PlanChoice) =>
	a.plan === b.plan && a.cycle === b.cycle && a.storagePacks === b.storagePacks;

/** The change waiting for the renewal, if any. */
export function scheduledChange(state: BillingState): PlanChoice | null {
	const { scheduledPlan, scheduledCycle, scheduledStoragePacks } = state;
	if (!scheduledPlan || !scheduledCycle || scheduledStoragePacks === null)
		return null;
	return {
		plan: scheduledPlan,
		cycle: scheduledCycle,
		storagePacks: scheduledStoragePacks,
	};
}

/** What the next renewal bills: the scheduled change, or the current plan. */
export const renewalPlan = (state: BillingState): PlanChoice =>
	scheduledChange(state) ?? {
		plan: state.plan,
		cycle: state.cycle,
		storagePacks: state.storagePacks,
	};

/** The first day a renewal can be paid. */
export const renewalOpensAt = (endsAt: Date) =>
	new Date(endsAt.getTime() - REMINDER_DAYS * DAY_MS);

/** Whether the next period can be paid now. */
export const canRenewNow = (
	state: Pick<BillingState, "status" | "endsAt">,
	now = new Date(),
) =>
	state.status === "expired" ||
	(!!state.endsAt && renewalOpensAt(state.endsAt) <= now);

/**
 * The price difference for the days left, rounded up to 100 millimes and
 * at least 1 DT.
 */
export function prorate(
	differencePerPeriod: number,
	cycle: BillingCycleId,
	remainingMs: number,
) {
	const periodMs = monthsIn(cycle) * AVERAGE_MONTH_MS;
	const amount = (differencePerPeriod * Math.max(0, remainingMs)) / periodMs;
	return Math.max(1, Math.ceil(amount * 10) / 10);
}

/** What picking `next` does, for this subscription, now. */
export function planChange(
	state: BillingState,
	next: PlanChoice,
	now = new Date(),
): PlanChange {
	if (state.status !== "active" || !state.paidUntil)
		return {
			kind: "subscribe",
			amount: pricePerPeriod(next.plan, next.cycle, next.storagePacks),
			startsAt: new Date(Math.max(now.getTime(), state.trialEndsAt.getTime())),
		};
	if (samePlan(state, next)) return { kind: "current" };

	const difference =
		pricePerPeriod(next.plan, next.cycle, next.storagePacks) -
		pricePerPeriod(state.plan, state.cycle, state.storagePacks);
	if (next.cycle !== state.cycle || difference <= 0)
		return { kind: "scheduled", from: state.paidUntil };

	// Only paid days count: what's left of the free month is free anyway.
	const paidFrom = Math.max(now.getTime(), state.trialEndsAt.getTime());
	const remainingMs = state.paidUntil.getTime() - paidFrom;
	return {
		kind: "upgrade",
		amount: prorate(difference, state.cycle, remainingMs),
		perMonth: difference / monthsIn(state.cycle),
		until: state.paidUntil,
		days: Math.max(1, Math.ceil(remainingMs / DAY_MS)),
	};
}
