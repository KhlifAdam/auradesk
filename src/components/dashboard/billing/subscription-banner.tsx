import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SubscriptionView } from "@/services/billing/queries";
import { REMINDER_DAYS } from "@/services/billing/status";

/** A reminder over every dashboard page in the last days of a period. */
export async function SubscriptionBanner({
	subscription,
}: {
	subscription: SubscriptionView;
}) {
	const t = await getTranslations("Billing.banner");
	const { status, daysLeft } = subscription;
	if (status === "expired" || daysLeft > REMINDER_DAYS) return null;

	return (
		<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-primary/20 bg-primary/5 px-4 py-1.5 text-xs">
			<span className="flex items-center gap-1.5">
				<Clock className="h-3.5 w-3.5 text-primary" />
				{t(status, { days: daysLeft })}
			</span>
			<Link
				href="/dashboard/subscription"
				className="flex items-center gap-1 font-medium text-primary hover:underline"
			>
				{t("action")}
				<ArrowRight className="h-3 w-3" />
			</Link>
		</div>
	);
}
