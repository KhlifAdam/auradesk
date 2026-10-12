import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { InvoiceStats } from "@/services/invoices/types";
import { formatMoney } from "@/services/projects/money";

const CARDS = [
	{ key: "invoiced", tone: "text-foreground" },
	{ key: "collected", tone: "text-success" },
	{ key: "outstanding", tone: "text-primary" },
	{ key: "overdueCount", tone: "text-destructive" },
] as const;

/** Invoiced, collected, still to collect and late invoices at a glance. */
export async function InvoiceStatsCards({ stats }: { stats: InvoiceStats }) {
	const t = await getTranslations("Invoices.stats");
	const locale = await getLocale();

	return (
		<dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{CARDS.map(({ key, tone }) => (
				<div
					key={key}
					className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5"
				>
					<dt className="text-xs text-muted-foreground">{t(key)}</dt>
					<dd className={cn("font-display text-xl font-bold", tone)}>
						{key === "overdueCount"
							? stats[key]
							: formatMoney(stats[key], locale)}
					</dd>
				</div>
			))}
		</dl>
	);
}

export function InvoiceStatsSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{CARDS.map(({ key }) => (
				<div
					key={key}
					className="h-16 animate-pulse rounded-xl border border-border bg-muted/50"
				/>
			))}
		</div>
	);
}
