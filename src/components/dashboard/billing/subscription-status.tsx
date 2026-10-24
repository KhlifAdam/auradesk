import { CalendarClock, CheckCircle2, Gift, Lock } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SubscriptionView } from "@/services/billing/queries";

const ICONS = { trial: Gift, active: CheckCircle2, expired: Lock } as const;
/** Length of the free month, for the progress bar. */
const TRIAL_DAYS = 30;

/** Where the photographer stands: free month, paid, or over. */
export async function SubscriptionStatus({
	subscription,
}: {
	subscription: SubscriptionView;
}) {
	const t = await getTranslations("Billing.status");
	const tPlans = await getTranslations("Billing.plans");
	const format = await getFormatter();
	const { status, endsAt, daysLeft, plan } = subscription;
	const Icon = ICONS[status];
	const date = endsAt ? format.dateTime(endsAt, { dateStyle: "long" }) : "";

	return (
		<section
			className={cn(
				"flex flex-col gap-3 rounded-xl border bg-card p-4",
				status === "expired" ? "border-destructive/40" : "border-border",
			)}
		>
			<div className="flex items-start gap-3">
				<span
					className={cn(
						"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
						status === "expired"
							? "bg-destructive/10 text-destructive"
							: "bg-primary/10 text-primary",
					)}
				>
					<Icon className="h-4 w-4" />
				</span>
				<div className="flex flex-1 flex-col gap-0.5">
					<h2 className="text-sm font-semibold">
						{t(`${status}.title`, {
							plan: tPlans(`${plan}.name`),
							days: daysLeft,
						})}
					</h2>
					<p className="text-xs text-muted-foreground">
						{t(`${status}.description`, { date })}
					</p>
				</div>
				{endsAt && (
					<span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
						<CalendarClock className="h-3.5 w-3.5" />
						{date}
					</span>
				)}
			</div>
			{status === "trial" && (
				<Progress
					value={
						((TRIAL_DAYS - Math.min(daysLeft, TRIAL_DAYS)) / TRIAL_DAYS) * 100
					}
					className="h-1.5"
				/>
			)}
		</section>
	);
}
