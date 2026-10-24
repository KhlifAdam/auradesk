import { Banknote } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { pricePerPeriod } from "@/services/billing/plans";
import type { SubscriptionView } from "@/services/billing/queries";

/** A short code that ties a payment to this account. */
export const paymentReference = (photographerId: string) =>
	`AD-${photographerId.slice(-6).toUpperCase()}`;

/** How to pay: amount, reference, and that the team activates the plan. */
export async function PaymentInfo({
	subscription,
}: {
	subscription: SubscriptionView;
}) {
	const t = await getTranslations("Billing.payment");
	const tPlans = await getTranslations("Billing.plans");
	const tCycles = await getTranslations("Billing.cycles");
	const { plan, cycle, photographerId } = subscription;

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex items-center gap-2">
				<Banknote className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold">{t("title")}</h2>
			</div>
			<dl className="grid gap-3 sm:grid-cols-3">
				<div>
					<dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
						{t("plan")}
					</dt>
					<dd className="text-sm">
						{tPlans(`${plan}.name`)} · {tCycles(cycle)}
					</dd>
				</div>
				<div>
					<dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
						{t("amount")}
					</dt>
					<dd className="text-sm font-semibold">
						{t("amountValue", { amount: pricePerPeriod(plan, cycle) })}
					</dd>
				</div>
				<div>
					<dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
						{t("reference")}
					</dt>
					<dd className="font-mono text-sm">
						{paymentReference(photographerId)}
					</dd>
				</div>
			</dl>
			<p className="text-xs leading-relaxed text-muted-foreground">
				{t("how")}
			</p>
		</section>
	);
}
