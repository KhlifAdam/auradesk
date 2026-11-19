import "server-only";

import { env } from "@/lib/env";
import { fakeGateway } from "./fake";
import { konnectGateway } from "./konnect";
import type { PaymentGatewayClient } from "./types";

/** The gateway new payments go through, chosen by PAYMENT_GATEWAY. */
export function getGateway(): PaymentGatewayClient {
	return env.PAYMENT_GATEWAY === "konnect" ? konnectGateway : fakeGateway;
}

/**
 * The gateway that issued an existing payment, so switching PAYMENT_GATEWAY
 * never strands payments already started on the other one.
 */
export function gatewayFor(id: "KONNECT" | "FAKE" | "MANUAL") {
	return id === "KONNECT" ? konnectGateway : id === "FAKE" ? fakeGateway : null;
}

export const isFakeGatewayEnabled = () => env.PAYMENT_GATEWAY === "fake";

const baseUrl = () => env.BETTER_AUTH_URL.replace(/\/$/, "");

/** Absolute app URL; gateways need full URLs to call back and redirect. */
export const appUrl = (path: string) => `${baseUrl()}${path}`;
