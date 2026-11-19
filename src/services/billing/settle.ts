import "server-only";

import type { BillingCheckout } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendBillingEmail } from "@/lib/mail/send-billing-email";
import { voidFakePayments } from "@/lib/payments/fake";
import { gatewayFor } from "@/lib/payments/gateway";
import {
	applyPayment,
	applyUpgrade,
	nextBillingInvoiceNumber,
	syncOpenInvoice,
} from "./apply-payment";

export type SettleResult =
	| "paid"
	| "alreadyPaid"
	| "pending"
	| "failed"
	| "unknown";

/**
 * Records a paid checkout: extends the plan by a period, or applies the
 * upgrade, and issues (or pays) its invoice.
 */
async function recordPaid(checkout: BillingCheckout) {
	return db.$transaction(async (tx) => {
		const [locked] = await tx.$queryRaw<{ status: string }[]>`
			SELECT status FROM billing_checkouts WHERE id = ${checkout.id} FOR UPDATE`;
		if (locked?.status === "COMPLETED") return null;

		const { plan, cycle, storagePacks, amountMillimes, photographerId, kind } =
			checkout;
		const paid = { plan, cycle, storagePacks };
		const period =
			kind === "UPGRADE"
				? await applyUpgrade(tx, photographerId, paid)
				: await applyPayment(tx, photographerId, paid);
		// A renewal invoice already waiting now bills the upgraded plan.
		if (kind === "UPGRADE") await syncOpenInvoice(tx, photographerId);
		const paidAt = new Date();
		const data = {
			status: "PAID" as const,
			paidAt,
			gateway: checkout.gateway,
			paymentRef: checkout.paymentRef,
			plan,
			cycle,
			storagePacks,
			kind,
			amountMillimes,
			...period,
		};
		// A period paid while its renewal invoice waits settles that invoice.
		const open =
			kind === "PERIOD"
				? await tx.billingInvoice.findFirst({
						where: {
							photographerId,
							status: "OPEN",
							kind: "PERIOD",
							...(checkout.invoiceId && { id: checkout.invoiceId }),
						},
						orderBy: { periodStart: "asc" },
					})
				: null;
		const invoice = open
			? await tx.billingInvoice.update({ where: { id: open.id }, data })
			: await tx.billingInvoice.create({
					data: {
						...data,
						photographerId,
						number: await nextBillingInvoiceNumber(tx),
					},
				});
		await tx.billingCheckout.update({
			where: { id: checkout.id },
			data: { status: "COMPLETED", completedAt: paidAt, invoiceId: invoice.id },
		});
		return invoice;
	});
}

/**
 * Once a payment went through, the photographer's other open attempts (a
 * second tab, an older choice) are void: what they would buy has changed.
 * The fake gateway then refuses them; Konnect's page simply expires, and a
 * payment it still reports as completed is recorded anyway.
 */
async function voidOtherCheckouts(paid: BillingCheckout) {
	const others = await db.billingCheckout.findMany({
		where: {
			photographerId: paid.photographerId,
			status: "PENDING",
			id: { not: paid.id },
		},
		select: { id: true, paymentRef: true, gateway: true },
	});
	if (others.length === 0) return;
	await db.billingCheckout.updateMany({
		where: { id: { in: others.map((other) => other.id) }, status: "PENDING" },
		data: { status: "CANCELLED" },
	});
	await voidFakePayments(
		others
			.filter((other) => other.gateway === "FAKE")
			.map((other) => other.paymentRef),
	);
}

/**
 * The one place a payment is confirmed: the webhook, the return page, the
 * fake gateway and the daily job all call it. The gateway is asked for the
 * status (callers are never trusted), and settling twice does nothing.
 * A payment the gateway reports as completed always counts, even if the
 * attempt was cancelled or expired on our side meanwhile.
 */
export async function settleCheckout(
	paymentRef: string,
): Promise<{ result: SettleResult; checkout?: BillingCheckout }> {
	const checkout = await db.billingCheckout.findUnique({
		where: { paymentRef },
	});
	if (!checkout) return { result: "unknown" };
	if (checkout.status === "COMPLETED")
		return { result: "alreadyPaid", checkout };

	const gateway = gatewayFor(checkout.gateway);
	const details = gateway ? await gateway.details(paymentRef) : null;
	if (details?.status === "pending" && checkout.expiresAt > new Date())
		return { result: "pending", checkout };
	if (
		details?.status !== "completed" ||
		details.amountMillimes < checkout.amountMillimes
	) {
		if (checkout.status === "PENDING" && checkout.expiresAt <= new Date())
			await db.billingCheckout.updateMany({
				where: { id: checkout.id, status: "PENDING" },
				data: { status: "EXPIRED" },
			});
		return { result: "failed", checkout };
	}

	const invoice = await recordPaid(checkout);
	if (!invoice) return { result: "alreadyPaid", checkout };
	await voidOtherCheckouts(checkout);

	await sendBillingEmail("receipt", checkout.photographerId, {
		number: invoice.number,
		amountMillimes: invoice.amountMillimes,
		date: invoice.periodEnd,
	}).catch(console.error);
	return { result: "paid", checkout };
}
