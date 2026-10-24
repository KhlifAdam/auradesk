import "server-only";

import { db } from "@/lib/db";
import { addMonths, subscriptionState } from "./status";

/**
 * The photographer's subscription, created on first use with a free month
 * from that moment (so accounts that existed before billing also get one).
 */
export async function getSubscription(photographerId: string) {
	// A plain read on every dashboard page; the write only happens once.
	const subscription =
		(await db.subscription.findUnique({ where: { photographerId } })) ??
		(await db.subscription.upsert({
			where: { photographerId },
			create: { photographerId, trialEndsAt: addMonths(new Date(), 1) },
			update: {},
		}));
	return { ...subscription, ...subscriptionState(subscription) };
}

export type SubscriptionView = Awaited<ReturnType<typeof getSubscription>>;
