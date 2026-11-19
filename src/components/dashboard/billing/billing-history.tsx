import { Receipt } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BillingInvoicePage } from "@/services/billing/invoice-queries";
import { formatMoney } from "@/services/projects/money";
import { RenewButton } from "./renew-button";

const STATUS_STYLE = {
	OPEN: "border-warning/40 text-warning",
	PAID: "border-success/40 text-success",
	CANCELLED: "text-muted-foreground",
} as const;

/**
 * AuraDesk's invoices to the studio: paid online, recorded by the team, or
 * waiting for the next period. An open invoice can be paid once the
 * renewal is due (`canPay`); the admin's view never pays.
 */
export async function BillingHistory({
	invoices,
	canPay = false,
}: {
	invoices: BillingInvoicePage;
	canPay?: boolean;
}) {
	const t = await getTranslations("Billing.history");
	const tBilling = await getTranslations("Billing");
	const format = await getFormatter();
	const locale = await getLocale();
	const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex items-center gap-2">
				<Receipt className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold">{t("title")}</h2>
			</div>
			{invoices.items.length === 0 ? (
				<p className="text-xs text-muted-foreground">{t("empty")}</p>
			) : (
				<ul className="divide-y divide-border">
					{invoices.items.map((invoice) => (
						<li
							key={invoice.id}
							className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
						>
							<div className="min-w-0 flex-1">
								<p className="flex items-center gap-2">
									<span className="font-mono text-xs font-medium">
										{invoice.number}
									</span>
									<Badge
										variant="outline"
										className={cn(
											"h-5 px-1.5 text-[10px]",
											STATUS_STYLE[invoice.status],
										)}
									>
										{t(`status.${invoice.status}`)}
									</Badge>
								</p>
								<p className="text-[11px] text-muted-foreground">
									{invoice.kind === "UPGRADE"
										? t("upgrade", {
												plan: tBilling(`plans.${invoice.plan}.name`),
											})
										: `${tBilling(`plans.${invoice.plan}.name`)} · ${tBilling(`cycles.${invoice.cycle}`)}`}{" "}
									·{" "}
									{t("period", {
										start: date(invoice.periodStart),
										end: date(invoice.periodEnd),
									})}
									{invoice.paidAt &&
										` · ${t(`paidVia.${invoice.gateway ?? "MANUAL"}`, {
											date: date(invoice.paidAt),
										})}`}
								</p>
							</div>
							<span className="text-sm font-semibold tabular-nums">
								{formatMoney(invoice.amount, locale)}
							</span>
							{invoice.status === "OPEN" && canPay && (
								<RenewButton label={t("pay")} compact />
							)}
						</li>
					))}
				</ul>
			)}
			<UrlPagination page={invoices.page} pageCount={invoices.pageCount} />
		</section>
	);
}
