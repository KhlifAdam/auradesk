export type SubscriptionStatus = "trial" | "active" | "expired";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The same date, `months` later (clamped to the end of shorter months). */
export function addMonths(date: Date, months: number) {
	const next = new Date(date);
	const day = next.getDate();
	next.setDate(1);
	next.setMonth(next.getMonth() + months);
	const lastDay = new Date(
		next.getFullYear(),
		next.getMonth() + 1,
		0,
	).getDate();
	next.setDate(Math.min(day, lastDay));
	return next;
}

/**
 * Where a subscription stands: paid, in its free month, or over. `endsAt`
 * is when the current state ends; `daysLeft` rounds up (a few hours = 1).
 */
export function subscriptionState(
	subscription: { trialEndsAt: Date; paidUntil: Date | null },
	now = new Date(),
) {
	const { trialEndsAt, paidUntil } = subscription;
	const status: SubscriptionStatus =
		paidUntil && paidUntil > now
			? "active"
			: trialEndsAt > now
				? "trial"
				: "expired";
	const endsAt =
		status === "active"
			? (paidUntil as Date)
			: status === "trial"
				? trialEndsAt
				: null;
	const daysLeft = endsAt
		? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS))
		: 0;
	return { status, endsAt, daysLeft };
}

/** Days before the end when the dashboard starts reminding. */
export const REMINDER_DAYS = 7;
