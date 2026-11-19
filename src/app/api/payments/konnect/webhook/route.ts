import { revalidatePath } from "next/cache";
import { settleCheckout } from "@/services/billing/settle";

/**
 * Konnect calls this (GET `?payment_ref=`) once a payment is done. The call
 * is not signed, so nothing in it is trusted: `settleCheckout` asks Konnect
 * for the payment's status. Always 200, so Konnect doesn't retry forever.
 */
export async function GET(request: Request) {
	const paymentRef = new URL(request.url).searchParams.get("payment_ref");
	if (!paymentRef || paymentRef.length > 128) return new Response("OK");

	try {
		const { result } = await settleCheckout(paymentRef);
		if (result === "paid") revalidatePath("/dashboard", "layout");
	} catch (error) {
		console.error("[billing] webhook could not settle", paymentRef, error);
	}
	return new Response("OK");
}
