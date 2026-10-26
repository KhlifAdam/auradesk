import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { InvoiceSummary } from "@/services/invoices/types";
import { formatMoney } from "@/services/projects/money";
import { InvoiceStatusBadge } from "./invoice-status-badge";

/** Invoice rows: number and client, dates, amount and what is left to pay. */
export async function InvoiceList({
	invoices,
	hrefBase = "/dashboard/invoices",
}: {
	invoices: InvoiceSummary[];
	/** Where a row links to: the dashboard, or the portal for clients. */
	hrefBase?: string;
}) {
	const t = await getTranslations("Invoices.list");
	const format = await getFormatter();
	const locale = await getLocale();
	const date = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "medium", timeZone: "UTC" });

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{invoices.map((invoice) => (
				<li key={invoice.id}>
					<Link
						href={`${hrefBase}/${invoice.id}`}
						className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate font-mono text-sm font-medium">
								{invoice.number}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{invoice.label ?? invoice.clientName} ·{" "}
								{date(invoice.issueDate)}
								{invoice.dueDate &&
									` · ${t("due", { date: date(invoice.dueDate) })}`}
							</p>
						</div>
						<div className="flex items-center gap-3 text-xs">
							<div className="flex flex-col items-end">
								<span className="text-sm font-semibold">
									{formatMoney(invoice.total, locale)}
								</span>
								{invoice.balance > 0 && invoice.status !== "DRAFT" && (
									<span className="text-[11px] text-muted-foreground">
										{t("balance", {
											amount: formatMoney(invoice.balance, locale),
										})}
									</span>
								)}
							</div>
							<InvoiceStatusBadge status={invoice.displayStatus} />
							<ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
