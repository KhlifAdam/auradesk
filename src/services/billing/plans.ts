/** AuraDesk's plans, in Tunisian dinars. Shared by the pricing page and the app. */
export const PLAN_IDS = ["STARTER", "PRO", "STUDIO"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const BILLING_CYCLES = ["MONTHLY", "YEARLY"] as const;
export type BillingCycleId = (typeof BILLING_CYCLES)[number];

/** Price of one month on monthly billing. */
export const MONTHLY_PRICES: Record<PlanId, number> = {
	STARTER: 19,
	PRO: 36,
	STUDIO: 79,
};

export const POPULAR_PLAN: PlanId = "PRO";

/** Paying for the year costs 20% less per month. */
const YEARLY_FACTOR = 0.8;

/** What a month costs on the chosen billing, in whole dinars. */
export function pricePerMonth(plan: PlanId, cycle: BillingCycleId) {
	const price = MONTHLY_PRICES[plan];
	return cycle === "YEARLY" ? Math.round(price * YEARLY_FACTOR) : price;
}

/** What one payment covers: a month, or twelve on yearly billing. */
export function pricePerPeriod(plan: PlanId, cycle: BillingCycleId) {
	return pricePerMonth(plan, cycle) * (cycle === "YEARLY" ? 12 : 1);
}
