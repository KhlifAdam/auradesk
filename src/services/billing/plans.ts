/** AuraDesk's plans, in Tunisian dinars. Shared by the pricing page and the app. */
export const PLAN_IDS = ["STARTER", "PRO", "STUDIO"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const BILLING_CYCLES = ["MONTHLY", "YEARLY"] as const;
export type BillingCycleId = (typeof BILLING_CYCLES)[number];

/** Price of one month on monthly billing. */
export const MONTHLY_PRICES: Record<PlanId, number> = {
	STARTER: 29,
	PRO: 59,
	STUDIO: 129,
};

export const POPULAR_PLAN: PlanId = "PRO";

/** Paying for the year costs 20% less per month. */
const YEARLY_FACTOR = 0.8;

/**
 * Extra storage sold on top of any plan, by the pack. A pack costs ~4.5 DT
 * a month on R2 when full, so it stays profitable.
 */
export const STORAGE_PACK = { gb: 100, monthlyPrice: 10, max: 20 } as const;

/** What a month costs on the chosen billing (storage packs included), in whole dinars. */
export function pricePerMonth(
	plan: PlanId,
	cycle: BillingCycleId,
	storagePacks = 0,
) {
	const price = MONTHLY_PRICES[plan] + storagePacks * STORAGE_PACK.monthlyPrice;
	return cycle === "YEARLY" ? Math.round(price * YEARLY_FACTOR) : price;
}

/** What one payment covers: a month, or twelve on yearly billing. */
export function pricePerPeriod(
	plan: PlanId,
	cycle: BillingCycleId,
	storagePacks = 0,
) {
	return (
		pricePerMonth(plan, cycle, storagePacks) * (cycle === "YEARLY" ? 12 : 1)
	);
}

export interface PlanLimits {
	/** Gallery and portfolio files, in GB. */
	storageGb: number;
	/** Questions to Aura per calendar month (owner's dashboard). */
	assistantMessages: number;
	/** Photos the AI culling can check per calendar month. */
	photoAnalyses: number;
	/** People invited to the team, besides the owner. */
	teamMembers: number;
}

/**
 * What each plan includes. Sized on what it costs to run: R2 storage
 * (~0.045 DT per GB a month) and the AI models, so even a studio that
 * uses all of it stays profitable.
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
	STARTER: {
		storageGb: 50,
		assistantMessages: 100,
		photoAnalyses: 1_000,
		teamMembers: 1,
	},
	PRO: {
		storageGb: 300,
		assistantMessages: 1_500,
		photoAnalyses: 10_000,
		teamMembers: 2,
	},
	STUDIO: {
		storageGb: 1_000,
		assistantMessages: 5_000,
		photoAnalyses: 30_000,
		teamMembers: 5,
	},
};

const GB = 1_000_000_000;

/** A plan's storage plus the packs bought on top, in GB. */
export const storageGbOf = (plan: PlanId, storagePacks = 0) =>
	PLAN_LIMITS[plan].storageGb + storagePacks * STORAGE_PACK.gb;

/** A plan's storage plus the packs bought on top, in bytes. */
export const storageBytesOf = (plan: PlanId, storagePacks = 0) =>
	storageGbOf(plan, storagePacks) * GB;
