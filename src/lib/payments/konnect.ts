import "server-only";

import { getKonnectEnv } from "@/lib/env";
import {
	type GatewayPaymentStatus,
	PAYMENT_LIFESPAN_MINUTES,
	type PaymentGatewayClient,
} from "./types";

interface KonnectPayment {
	status: string;
	amount: number;
}

async function konnectFetch(path: string, init?: RequestInit) {
	const { KONNECT_API_URL, KONNECT_API_KEY } = getKonnectEnv();
	const response = await fetch(`${KONNECT_API_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			"x-api-key": KONNECT_API_KEY,
		},
		cache: "no-store",
	});
	return response;
}

function toStatus(status: string): GatewayPaymentStatus {
	if (status === "completed") return "completed";
	if (status === "pending") return "pending";
	return "failed";
}

/**
 * konnect.network: `init-payment` opens a hosted checkout for the AuraDesk
 * wallet; Konnect then calls the webhook with `?payment_ref=`, and we ask it
 * for the payment's status (the webhook itself is not signed).
 */
export const konnectGateway: PaymentGatewayClient = {
	id: "KONNECT",

	async init(input) {
		const { KONNECT_WALLET_ID } = getKonnectEnv();
		const response = await konnectFetch("/payments/init-payment", {
			method: "POST",
			body: JSON.stringify({
				receiverWalletId: KONNECT_WALLET_ID,
				token: "TND",
				amount: input.amountMillimes,
				type: "immediate",
				description: input.description,
				acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
				lifespan: PAYMENT_LIFESPAN_MINUTES,
				checkoutForm: true,
				addPaymentFeesToAmount: false,
				...input.customer,
				orderId: input.orderId,
				webhook: input.webhookUrl,
				successUrl: input.successUrl,
				failUrl: input.failUrl,
			}),
		});
		if (!response.ok)
			throw new Error(
				`Konnect init-payment failed [${response.status}]: ${await response.text()}`,
			);
		const data = (await response.json()) as {
			payUrl: string;
			paymentRef: string;
		};
		return {
			paymentRef: data.paymentRef,
			payUrl: data.payUrl,
			expiresAt: new Date(Date.now() + PAYMENT_LIFESPAN_MINUTES * 60_000),
		};
	},

	async details(paymentRef) {
		const response = await konnectFetch(
			`/payments/${encodeURIComponent(paymentRef)}`,
		);
		if (response.status === 404) return null;
		if (!response.ok)
			throw new Error(`Konnect payment lookup failed [${response.status}]`);
		const { payment } = (await response.json()) as { payment: KonnectPayment };
		return { status: toStatus(payment.status), amountMillimes: payment.amount };
	},
};
