import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FakeCheckout } from "@/components/billing/fake-gateway/fake-checkout";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { isFakeGatewayEnabled } from "@/lib/payments/gateway";
import { returnPath } from "@/services/billing/checkout";
import { getFakePayPage } from "@/services/billing/fake-gateway-queries";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("FakeGateway");
	return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * The fake gateway's hosted pay page (PAYMENT_GATEWAY=fake): where Konnect's
 * own checkout would be. Gone entirely when the real gateway is on.
 */
export default async function FakePayPage({
	params,
}: {
	params: Promise<{ paymentRef: string }>;
}) {
	if (!isFakeGatewayEnabled()) notFound();
	const { session, photographerId } = await requirePhotographer();
	const { paymentRef } = await params;
	const payment = await getFakePayPage(paymentRef, photographerId);
	if (!payment) notFound();
	if (payment.status === "completed") redirect(returnPath(payment.checkoutId));

	return (
		<FakeCheckout
			payment={payment}
			payer={{ name: session.user.name, email: session.user.email }}
		/>
	);
}
