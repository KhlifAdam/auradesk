/** How long a payment link stays open; Konnect's maximum. */
export const PAYMENT_LIFESPAN_MINUTES = 60;

export interface InitPaymentInput {
	/** 1 TND = 1000 millimes. */
	amountMillimes: number;
	description: string;
	/** Our id for the payment, echoed back by the gateway. */
	orderId: string;
	/** Where the gateway calls when the payment is done (`?payment_ref=`). */
	webhookUrl: string;
	/** Where the payer lands after paying, or after failing or cancelling. */
	successUrl: string;
	failUrl: string;
	customer: { firstName?: string; lastName?: string; email?: string };
}

export interface InitPaymentResult {
	paymentRef: string;
	payUrl: string;
	expiresAt: Date;
}

export type GatewayPaymentStatus = "pending" | "completed" | "failed";

export interface PaymentDetails {
	status: GatewayPaymentStatus;
	amountMillimes: number;
}

/** What both the real Konnect client and the fake gateway provide. */
export interface PaymentGatewayClient {
	id: "KONNECT" | "FAKE";
	init(input: InitPaymentInput): Promise<InitPaymentResult>;
	/** The gateway's own word on a payment; null when it does not know it. */
	details(paymentRef: string): Promise<PaymentDetails | null>;
}

/** Dinars (3 decimals) to the millimes gateways expect. */
export const toMillimes = (dinars: number) => Math.round(dinars * 1000);

/** Millimes back to dinars, for display. */
export const fromMillimes = (millimes: number) => millimes / 1000;
