import {
	BookImage,
	ChevronRight,
	FolderKanban,
	Receipt,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import type { CollectReason } from "@/lib/money/collect";
import { cn } from "@/lib/utils";
import { getMoneyOverview } from "@/services/money/queries";
import { formatMoney } from "@/services/projects/money";

const ICONS = { invoice: Receipt, book: BookImage, project: FolderKanban };

const TONE: Record<CollectReason, string> = {
	overdue: "bg-destructive/15 text-destructive",
	deliveredUnpaid: "bg-warning/15 text-warning",
	readyUnpaid: "bg-warning/15 text-warning",
	deliveringSoon: "bg-primary/15 text-primary",
	dueSoon: "bg-primary/15 text-primary",
	open: "bg-muted text-muted-foreground",
};

/** What the studio is owed, and the next few amounts to collect, most pressing first. */
export async function MoneyCard() {
	const t = await getTranslations("Money");
	const locale = await getLocale();
	const { photographerId } = await requirePhotographer();
	const money = await getMoneyOverview(photographerId);
	const fmt = (v: number) => formatMoney(v, locale);

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
			<div className="flex items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 text-sm font-semibold">
					<Wallet className="h-4 w-4 text-primary" />
					{t("title")}
				</h2>
				<Link
					href="/dashboard/invoices"
					className="text-xs text-muted-foreground hover:text-foreground"
				>
					{t("allInvoices")}
				</Link>
			</div>
			<div className="grid grid-cols-3 gap-2">
				<Figure label={t("toCollect")} value={fmt(money.toCollect)} strong />
				<Figure
					label={t("overdue", { count: money.overdue.count })}
					value={fmt(money.overdue.amount)}
					danger={money.overdue.count > 0}
				/>
				<Figure
					label={t("collectedThisMonth")}
					value={fmt(money.collectedThisMonth)}
					success
				/>
			</div>
			{money.items.length === 0 ? (
				<p className="text-xs text-muted-foreground">{t("allPaid")}</p>
			) : (
				<ul className="flex flex-col divide-y divide-border/60">
					{money.items.map((item) => {
						const Icon = ICONS[item.kind];
						return (
							<li key={`${item.kind}-${item.id}`}>
								<Link
									href={item.href}
									className="flex items-center gap-2.5 py-2 text-xs transition-colors hover:text-primary"
								>
									<Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-medium">{item.label}</span>
										<span className="truncate text-[11px] text-muted-foreground">
											{item.clientName}
										</span>
									</span>
									<span
										className={cn(
											"hidden shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:inline",
											TONE[item.reason],
										)}
									>
										{t(`reasons.${item.reason}`, { days: item.days ?? 0 })}
									</span>
									<span className="shrink-0 font-semibold tabular-nums">
										{fmt(item.amount)}
									</span>
									<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
								</Link>
							</li>
						);
					})}
				</ul>
			)}
			{money.total > money.items.length && (
				<p className="text-[11px] text-muted-foreground">
					{t("more", { count: money.total - money.items.length })}
				</p>
			)}
		</section>
	);
}

function Figure({
	label,
	value,
	strong,
	danger,
	success,
}: {
	label: string;
	value: string;
	strong?: boolean;
	danger?: boolean;
	success?: boolean;
}) {
	return (
		<div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-2.5 py-2">
			<span className="truncate text-[11px] text-muted-foreground">
				{label}
			</span>
			<span
				className={cn(
					"truncate text-sm font-semibold tabular-nums",
					strong && "text-foreground",
					danger && "text-destructive",
					success && "text-success",
				)}
			>
				{value}
			</span>
		</div>
	);
}

export function MoneyCardSkeleton() {
	return <Skeleton className="h-56 w-full rounded-xl" />;
}
