import type { BillingCycleId } from "./plans";
import { addMonths } from "./status";

export const monthsIn = (cycle: BillingCycleId) =>
	cycle === "YEARLY" ? 12 : 1;

/**
 * The period one payment buys: it starts when the paid period or free month
 * ends (or now, if both are over), so no paid day is ever lost.
 */
export function nextPeriod(
	subscription: { trialEndsAt: Date; paidUntil: Date | null },
	cycle: BillingCycleId,
	now = new Date(),
) {
	const periodStart = new Date(
		Math.max(
			now.getTime(),
			subscription.trialEndsAt.getTime(),
			subscription.paidUntil?.getTime() ?? 0,
		),
	);
	return { periodStart, periodEnd: addMonths(periodStart, monthsIn(cycle)) };
}
