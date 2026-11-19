"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { markFakePaymentCompleted } from "@/lib/payments/fake";
import { isFakeGatewayEnabled } from "@/lib/payments/gateway";
import { returnPath } from "./checkout";
import { fakePaymentSchema } from "./schemas";
import { settleCheckout } from "./settle";

type Redirect = ActionResult<{ redirectTo: string }>;

/** The photographer's own checkout behind a fake payment ref. */
async function ownCheckout(input: unknown) {
	if (!isFakeGatewayEnabled()) return null;
	const { photographerId } = await requirePhotographer();
	const parsed = fakePaymentSchema.safeParse(input);
	if (!parsed.success) return null;
	return db.billingCheckout.findFirst({
		where: { paymentRef: parsed.data.paymentRef, photographerId },
	});
}

/**
 * The card was accepted on the fake pay page. Like Konnect, the gateway
 * marks the payment completed and notifies the app, which settles it.
 * Card details never reach the server.
 */
export async function completeFakePayment(input: unknown): Promise<Redirect> {
	const checkout = await ownCheckout(input);
	if (!checkout) return fail("notFound");
	if (checkout.status === "COMPLETED")
		return ok({ redirectTo: returnPath(checkout.id) });
	// Voided by another payment (or cancelled): the bank refuses it.
	if (checkout.status !== "PENDING") return fail("paymentExpired");

	const completed = await markFakePaymentCompleted(checkout.paymentRef);
	const { result } = await settleCheckout(checkout.paymentRef);
	if (!completed && result !== "alreadyPaid") return fail("paymentExpired");
	revalidatePath("/dashboard", "layout");
	return ok({ redirectTo: returnPath(checkout.id) });
}

/** The payer gave up: back to the app through the fail URL. */
export async function cancelFakePayment(input: unknown): Promise<Redirect> {
	const checkout = await ownCheckout(input);
	if (!checkout) return fail("notFound");
	return ok({ redirectTo: returnPath(checkout.id, true) });
}
