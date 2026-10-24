import { getTranslations } from "next-intl/server";
import { PaymentInfo } from "@/components/dashboard/billing/payment-info";
import { PlanPicker } from "@/components/dashboard/billing/plan-picker";
import { SubscriptionStatus } from "@/components/dashboard/billing/subscription-status";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getSubscription } from "@/services/billing/queries";

/** The photographer's AuraDesk plan: free month, choice of plan, payment. */
export default async function SubscriptionPage() {
	const t = await getTranslations("Billing");
	const { photographerId } = await requirePhotographer();
	const subscription = await getSubscription(photographerId);

	return (
		<PageShell>
			<PageHeader title={t("title")} description={t("description")} />
			<div className="flex max-w-3xl flex-col gap-3">
				<SubscriptionStatus subscription={subscription} />
				<PlanPicker
					defaultValues={{ plan: subscription.plan, cycle: subscription.cycle }}
				/>
				<PaymentInfo subscription={subscription} />
			</div>
		</PageShell>
	);
}
