import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-session";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { db } from "@/lib/db";
import { settleCheckout } from "@/services/billing/settle";

/**
 * Where the gateway sends the payer back (`?checkout=`, plus `failed=1` on
 * the fail URL). The payment is settled here too, so the plan is active at
 * once, even when the webhook can't reach us (localhost) or comes late.
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const to = (payment?: string) =>
		NextResponse.redirect(
			new URL(
				`/dashboard/subscription${payment ? `?payment=${payment}` : ""}`,
				url,
			),
		);

	const user = await getApiUser();
	if (!user)
		return NextResponse.redirect(new URL(AUTH_PATHS.photographer.login, url));

	const checkout = await db.billingCheckout.findFirst({
		where: {
			id: url.searchParams.get("checkout") ?? "",
			photographerId: user.id,
		},
	});
	if (!checkout) return to();

	const { result } = await settleCheckout(checkout.paymentRef);
	revalidatePath("/dashboard", "layout");
	if (result === "paid" || result === "alreadyPaid") return to("success");
	if (result === "pending" && !url.searchParams.has("failed"))
		return to("pending");

	await db.billingCheckout.updateMany({
		where: { id: checkout.id, status: "PENDING" },
		data: { status: "CANCELLED" },
	});
	return to(url.searchParams.has("failed") ? "cancelled" : "failed");
}
