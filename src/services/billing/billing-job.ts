import "server-only";

import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { sendBillingEmail } from "@/lib/mail/send-billing-email";
import { toMillimes } from "@/lib/payments/types";
import { nextBillingInvoiceNumber } from "./apply-payment";
import { nextPeriod } from "./period";
import { renewalPlan } from "./plan-change";
import { pricePerPeriod } from "./plans";
import { settleCheckout } from "./settle";
import { REMINDER_DAYS, subscriptionState } from "./status";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Most rows handled per run; the rest wait for the next day. */
const BATCH = 200;

/**
 * Asks the gateway about every pending payment, in case its webhook was
 * lost: paid ones are settled, stale ones expire.
 */
async function reconcilePending() {
	const pending = await db.billingCheckout.findMany({
		where: { status: "PENDING" },
		select: { paymentRef: true },
		orderBy: { createdAt: "asc" },
		take: BATCH,
	});
	let settled = 0;
	let expired = 0;
	for (const { paymentRef } of pending) {
		try {
			const { result } = await settleCheckout(paymentRef);
			if (result === "paid") settled++;
			if (result === "failed") expired++;
		} catch (error) {
			console.error("[billing] could not check", paymentRef, error);
		}
	}
	return { settled, expired };
}

/**
 * Opens next period's invoice for studios whose paid period or free month
 * ends within REMINDER_DAYS, once (never two open invoices), and emails it.
 */
async function openRenewals(now: Date) {
	const soon = new Date(now.getTime() + REMINDER_DAYS * DAY_MS);
	const due = await db.subscription.findMany({
		where: {
			OR: [
				{ paidUntil: { gt: now, lte: soon } },
				{ paidUntil: null, trialEndsAt: { gt: now, lte: soon } },
			],
			photographer: {
				role: ROLES.photographer,
				deletedAt: null,
				billingInvoices: { none: { status: "OPEN", kind: "PERIOD" } },
			},
		},
		take: BATCH,
	});

	let opened = 0;
	for (const subscription of due) {
		const { photographerId } = subscription;
		const { plan, cycle, storagePacks } = renewalPlan({
			...subscription,
			...subscriptionState(subscription, now),
		});
		const period = nextPeriod(subscription, cycle, now);
		const invoice = await db.$transaction(async (tx) =>
			tx.billingInvoice.create({
				data: {
					photographerId,
					number: await nextBillingInvoiceNumber(tx, now),
					status: "OPEN",
					plan,
					cycle,
					storagePacks,
					amountMillimes: toMillimes(pricePerPeriod(plan, cycle, storagePacks)),
					...period,
					dueDate: period.periodStart,
				},
			}),
		);
		opened++;
		await sendBillingEmail("renewal", photographerId, {
			number: invoice.number,
			amountMillimes: invoice.amountMillimes,
			date: period.periodStart,
		}).catch(console.error);
	}
	return opened;
}

/** The daily billing run (`/api/cron/billing`). */
export async function runBillingJob(now = new Date()) {
	const { settled, expired } = await reconcilePending();
	const invoices = await openRenewals(now);
	return { settled, expired, invoices };
}
