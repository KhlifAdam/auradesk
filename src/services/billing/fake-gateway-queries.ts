import "server-only";

import { db } from "@/lib/db";
import { fromMillimes } from "@/lib/payments/types";

/** A fake payment as its pay page shows it; only the payer's own. */
export async function getFakePayPage(
	paymentRef: string,
	photographerId: string,
) {
	const [checkout, payment] = await Promise.all([
		db.billingCheckout.findFirst({ where: { paymentRef, photographerId } }),
		db.fakePayment.findUnique({ where: { paymentRef } }),
	]);
	if (!checkout || !payment) return null;
	return {
		checkoutId: checkout.id,
		paymentRef,
		plan: checkout.plan,
		cycle: checkout.cycle,
		kind: checkout.kind,
		amount: fromMillimes(payment.amountMillimes),
		status: payment.status,
		expiresAt: payment.expiresAt.toISOString(),
	};
}
