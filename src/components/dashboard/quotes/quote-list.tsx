import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { formatMoney } from "@/services/projects/money";
import type { QuoteSummary } from "@/services/quotes/types";
import { QuoteStatusBadge } from "./quote-status-badge";

/** Quote rows: number and client, dates, amount and status. */
export async function QuoteList({
	quotes,
	hrefBase = "/dashboard/invoices/quotes",
}: {
	quotes: QuoteSummary[];
	/** Where a row links to: the dashboard, or the portal for clients. */
	hrefBase?: string;
}) {
	const t = await getTranslations("Quotes.list");
	const format = await getFormatter();
	const locale = await getLocale();
	const date = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "medium", timeZone: "UTC" });

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{quotes.map((quote) => (
				<li key={quote.id}>
					<Link
						href={`${hrefBase}/${quote.id}`}
						className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50"
					>
						<div className="min-w-0 flex-1">
							<p className="truncate font-mono text-sm font-medium">
								{quote.number}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{quote.label ?? quote.clientName} · {date(quote.issueDate)}
								{quote.validUntil &&
									` · ${t("validUntil", { date: date(quote.validUntil) })}`}
							</p>
						</div>
						<div className="flex items-center gap-3 text-xs">
							<span className="text-sm font-semibold">
								{formatMoney(quote.total, locale)}
							</span>
							<QuoteStatusBadge status={quote.displayStatus} />
							<ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
