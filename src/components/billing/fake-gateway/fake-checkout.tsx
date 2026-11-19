"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { useErrorMessage } from "@/hooks/use-error-message";
import { BRAND_NAME } from "@/lib/brand";
import { cancelFakePayment } from "@/services/billing/fake-gateway-actions";
import type { BillingCycleId, PlanId } from "@/services/billing/plans";
import { CardPanel } from "./card-panel";
import { CheckoutSummary } from "./checkout-summary";
import { formatGatewayAmount, gw } from "./checkout-ui";
import { ContactStep } from "./contact-step";
import { useCountdown } from "./use-countdown";

interface Props {
	payment: {
		paymentRef: string;
		plan: PlanId;
		cycle: BillingCycleId;
		kind: "PERIOD" | "UPGRADE";
		amount: number;
		expiresAt: string;
	};
	payer: { name: string; email: string };
}

/**
 * The gateway's hosted checkout, laid out like Konnect's: the summary on
 * the left; on the right the contact details, then the card types, each
 * unfolding its card form in place.
 */
export function FakeCheckout({ payment, payer }: Props) {
	const t = useTranslations("FakeGateway");
	const tBilling = useTranslations("Billing");
	const locale = useLocale();
	const errorMessage = useErrorMessage();
	const { expired, label } = useCountdown(payment.expiresAt);
	const [leaving, startLeaving] = useTransition();
	const amount = formatGatewayAmount(payment.amount, locale);
	const [firstName = "", ...rest] = payer.name.trim().split(/\s+/);

	function cancel() {
		startLeaving(async () => {
			const result = await cancelFakePayment({
				paymentRef: payment.paymentRef,
			});
			if (!result.ok) return void toast.error(errorMessage(result.error));
			window.location.assign(result.data.redirectTo);
		});
	}

	return (
		<div className={`${gw.page} grid grid-cols-1 sm:grid-cols-2`}>
			<CheckoutSummary
				amount={amount}
				remaining={label}
				description={`${BRAND_NAME} · ${
					payment.kind === "UPGRADE"
						? tBilling("history.upgrade", {
								plan: tBilling(`plans.${payment.plan}.name`),
							})
						: `${tBilling(`plans.${payment.plan}.name`)} · ${tBilling(`cycles.${payment.cycle}`)}`
				}`}
			/>
			<div className="flex flex-col items-center justify-between gap-y-4 p-6 shadow-md sm:items-start sm:px-14 sm:pt-14 sm:pb-4">
				<ContactStep
					defaults={{
						firstName,
						lastName: rest.join(" "),
						phone: "",
						email: payer.email,
					}}
					disabled={expired || leaving}
					panel={(method, open, checkContact) => (
						<CardPanel
							method={method}
							open={open}
							paymentRef={payment.paymentRef}
							amount={amount}
							expired={expired}
							checkContact={checkContact}
						/>
					)}
				/>
				{expired && (
					<p role="alert" className={`w-full max-w-sm ${gw.alert}`}>
						{t("expired")}
					</p>
				)}
				<div className="mt-10 flex w-full max-w-sm items-center justify-between text-xs opacity-60">
					<span className="flex items-center gap-1.5">
						<Lock className="h-3.5 w-3.5" />
						{t("secure")}
					</span>
					<button
						type="button"
						onClick={cancel}
						disabled={leaving}
						className="underline-offset-2 transition-opacity duration-200 hover:underline hover:opacity-100"
					>
						{t("cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}
