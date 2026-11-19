import "server-only";

import { randomUUID } from "node:crypto";
import type { BillingKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { appUrl, getGateway } from "@/lib/payments/gateway";
import { toMillimes } from "@/lib/payments/types";
import type { PaidPlan } from "./apply-payment";

/** A pending attempt this close to expiring is not reused. */
const REUSE_MARGIN_MS = 5 * 60_000;

/** Where the gateway sends the payer back; `failed` on the fail URL. */
export const returnPath = (checkoutId: string, failed = false) =>
	`/dashboard/subscription/return?checkout=${checkoutId}${failed ? "&failed=1" : ""}`;

/**
 * Opens (or reuses) a payment for `paid`: a period of it, or an upgrade to
 * it, optionally paying an open renewal invoice. `amount` (in dinars) is
 * worked out by the caller from the price list, never taken from the client.
 * Returns the gateway's pay URL.
 */
export async function openCheckout(
	user: { id: string; name: string; email: string },
	paid: PaidPlan,
	{
		kind,
		amount,
		invoiceId = null,
	}: { kind: BillingKind; amount: number; invoiceId?: string | null },
) {
	const gateway = getGateway();
	const amountMillimes = toMillimes(amount);

	// Starting again after closing the pay page reuses the same attempt,
	// so abandoned attempts don't pile up.
	const live = await db.billingCheckout.findFirst({
		where: {
			photographerId: user.id,
			gateway: gateway.id,
			status: "PENDING",
			...paid,
			kind,
			// An upgrade's price drifts by the minute: the same upgrade opened
			// again (another tab) is still the same payment.
			...(kind === "PERIOD" && { amountMillimes }),
			invoiceId,
			expiresAt: { gt: new Date(Date.now() + REUSE_MARGIN_MS) },
		},
		orderBy: { createdAt: "desc" },
	});
	if (live) return live.payUrl;

	const id = randomUUID();
	const [firstName, ...rest] = user.name.trim().split(/\s+/);
	const payment = await gateway.init({
		amountMillimes,
		description: `AuraDesk ${paid.plan} · ${paid.cycle}${kind === "UPGRADE" ? " · upgrade" : ""}`,
		orderId: id,
		webhookUrl: appUrl("/api/payments/konnect/webhook"),
		successUrl: appUrl(returnPath(id)),
		failUrl: appUrl(returnPath(id, true)),
		customer: {
			firstName,
			lastName: rest.join(" ") || undefined,
			email: user.email,
		},
	});
	await db.billingCheckout.create({
		data: {
			id,
			photographerId: user.id,
			gateway: gateway.id,
			paymentRef: payment.paymentRef,
			payUrl: payment.payUrl,
			...paid,
			kind,
			amountMillimes,
			expiresAt: payment.expiresAt,
			invoiceId,
		},
	});
	return payment.payUrl;
}
