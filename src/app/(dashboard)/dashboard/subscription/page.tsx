import { getTranslations } from "next-intl/server";
import { BillingHistory } from "@/components/dashboard/billing/billing-history";
import { PaymentInfo } from "@/components/dashboard/billing/payment-info";
import {
	PAYMENT_RESULTS,
	PaymentResultNotice,
} from "@/components/dashboard/billing/payment-result";
import { PlanCard } from "@/components/dashboard/billing/plan-card";
import { SubscriptionStatus } from "@/components/dashboard/billing/subscription-status";
import { UsageCard } from "@/components/dashboard/billing/usage-card";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { listBillingInvoices } from "@/services/billing/invoice-queries";
import { canRenewNow } from "@/services/billing/plan-change";
import { getSubscription } from "@/services/billing/queries";
import { getUsageSummary } from "@/services/billing/usage";
import { pageParamsSchema } from "@/services/shared/pagination";

/**
 * The photographer's AuraDesk plan: free month, the plan section (subscribe,
 * renew, change plan or storage), paying by transfer instead, and the
 * billing history. `?change=1` opens the plan change, e.g. from "Add storage".
 */
export default async function SubscriptionPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; payment?: string; change?: string }>;
}) {
	const t = await getTranslations("Billing");
	const { photographerId } = await requirePhotographer();
	const params = await searchParams;
	const { page } = pageParamsSchema.parse(params);
	const result = PAYMENT_RESULTS.find((value) => value === params.payment);
	const [subscription, usage, invoices] = await Promise.all([
		getSubscription(photographerId),
		getUsageSummary(photographerId),
		listBillingInvoices(photographerId, page),
	]);
	const canRenew = canRenewNow(subscription);

	return (
		<PageShell>
			<PageHeader title={t("title")} description={t("description")} />
			<div className="flex max-w-3xl flex-col gap-3">
				{result && <PaymentResultNotice result={result} />}
				<SubscriptionStatus subscription={subscription} />
				<UsageCard usage={usage} />
				<PlanCard
					state={subscription}
					canRenew={canRenew}
					usedStorageGb={Math.ceil(usage.storage.used / 1e9)}
					startOpen={params.change === "1"}
				/>
				{(subscription.status !== "active" || canRenew) && (
					<PaymentInfo subscription={subscription} />
				)}
				<BillingHistory invoices={invoices} canPay={canRenew} />
			</div>
		</PageShell>
	);
}
