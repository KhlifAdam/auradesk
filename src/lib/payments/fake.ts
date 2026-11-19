import "server-only";

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import {
	type GatewayPaymentStatus,
	PAYMENT_LIFESPAN_MINUTES,
	type PaymentGatewayClient,
} from "./types";

/**
 * Our imitation of Konnect (PAYMENT_GATEWAY=fake). It behaves like the real
 * one from the app's side: a hosted pay page, a webhook, a status lookup.
 * Its "servers" are the `fake_payments` table, so it survives restarts.
 */
export const fakeGateway: PaymentGatewayClient = {
	id: "FAKE",

	async init(input) {
		// 24 hex characters, the shape of Konnect's own payment refs.
		const paymentRef = randomBytes(12).toString("hex");
		const expiresAt = new Date(Date.now() + PAYMENT_LIFESPAN_MINUTES * 60_000);
		await db.fakePayment.create({
			data: {
				paymentRef,
				amountMillimes: input.amountMillimes,
				description: input.description,
				expiresAt,
			},
		});
		return { paymentRef, payUrl: `/pay/${paymentRef}`, expiresAt };
	},

	async details(paymentRef) {
		const payment = await db.fakePayment.findUnique({ where: { paymentRef } });
		if (!payment) return null;
		const expired =
			payment.status === "pending" && payment.expiresAt < new Date();
		return {
			status: expired ? "failed" : (payment.status as GatewayPaymentStatus),
			amountMillimes: payment.amountMillimes,
		};
	},
};

/** The payer confirmed a valid card on the fake pay page. */
export async function markFakePaymentCompleted(paymentRef: string) {
	const { count } = await db.fakePayment.updateMany({
		where: { paymentRef, status: "pending", expiresAt: { gt: new Date() } },
		data: { status: "completed", completedAt: new Date() },
	});
	return count === 1;
}

/** Payments made obsolete by another one: they can no longer be paid. */
export async function voidFakePayments(paymentRefs: string[]) {
	if (paymentRefs.length === 0) return;
	await db.fakePayment.updateMany({
		where: { paymentRef: { in: paymentRefs }, status: "pending" },
		data: { status: "failed" },
	});
}
