import { getFormatter, getTranslations } from "next-intl/server";
import { paymentReference } from "@/components/dashboard/billing/payment-info";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { pricePerPeriod } from "@/services/billing/plans";
import type { SubscriptionView } from "@/services/billing/queries";
import { RecordPaymentButton } from "./record-payment-button";

/** A photographer's plan for the admin, with the payment to record. */
export async function SubscriptionCard({
	userId,
	subscription,
}: {
	userId: string;
	subscription: SubscriptionView;
}) {
	const t = await getTranslations("Admin.billing");
	const tBilling = await getTranslations("Billing");
	const format = await getFormatter();
	const { status, plan, cycle, trialEndsAt, paidUntil } = subscription;
	const date = (value: Date | null) =>
		value ? format.dateTime(value, { dateStyle: "medium" }) : "—";
	const planLabel = `${tBilling(`plans.${plan}.name`)} · ${tBilling(`cycles.${cycle}`)}`;
	const amount = tBilling("payment.amountValue", {
		amount: pricePerPeriod(plan, cycle),
	});
	const facts = [
		{ label: t("plan"), value: planLabel },
		{ label: t("amount"), value: amount },
		{ label: t("trialEnds"), value: date(trialEndsAt) },
		{ label: t("paidUntil"), value: date(paidUntil) },
		{ label: t("reference"), value: paymentReference(userId) },
	];

	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 text-sm font-semibold">
					{t("title")}
					<Badge
						variant="outline"
						className={cn(
							"h-5 px-1.5 text-[10px]",
							status === "expired" && "border-destructive/40 text-destructive",
							status === "active" && "border-primary/40 text-primary",
						)}
					>
						{t(`status.${status}`)}
					</Badge>
				</h2>
				<RecordPaymentButton
					userId={userId}
					summary={`${planLabel} · ${amount}`}
				/>
			</div>
			<dl className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-5">
				{facts.map((fact) => (
					<div key={fact.label} className="min-w-0">
						<dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
							{fact.label}
						</dt>
						<dd className="truncate text-sm">{fact.value}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}
