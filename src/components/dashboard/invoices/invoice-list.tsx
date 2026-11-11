import { BookOpen, Camera, ChevronRight, Receipt } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import {
	ChangePill,
	changeRowHighlight,
} from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import type { InvoiceKind, InvoiceSummary } from "@/services/invoices/types";
import { formatMoney } from "@/services/projects/money";
import { InvoiceStatusBadge } from "./invoice-status-badge";

const KIND_ICON: Record<InvoiceKind, typeof Camera> = {
	project: Camera,
	book: BookOpen,
	custom: Receipt,
};

/**
 * Invoice rows: what is billed (project, photo book or first line) as the
 * title, then the number, who it is for and the dates; amount and status.
 */
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
			{invoices.map((invoice) => {
				const Icon = KIND_ICON[invoice.kind];
				const issued = invoice.status !== "DRAFT";
				const partial = issued && invoice.paid > 0 && invoice.balance > 0;
				return (
					<li key={invoice.id}>
						<Link
							href={`${hrefBase}/${invoice.id}`}
							className={cn(
								"flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50",
								changeRowHighlight(invoice.mark ?? null),
							)}
						>
							<span
								title={t(`kind.${invoice.kind}`)}
								className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
							>
								<Icon className="h-4 w-4" />
								<span className="sr-only">{t(`kind.${invoice.kind}`)}</span>
							</span>
							<div className="min-w-0 flex-1">
								<p className="flex items-center gap-2 text-sm font-medium">
									<span className="truncate">
										{invoice.subject ?? t("untitled")}
									</span>
									{/* Says plainly what it bills: a project, a book, or nothing linked. */}
									<span
										className={cn(
											"shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
											invoice.kind === "custom"
												? "bg-muted text-muted-foreground"
												: "bg-primary/10 text-primary",
										)}
									>
										{t(`kind.${invoice.kind}`)}
									</span>
									<ChangePill mark={invoice.mark ?? null} />
								</p>
								<p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
									<span className="font-mono text-[11px] text-foreground/80">
										{invoice.number}
									</span>
									<span aria-hidden>·</span>
									<span className="truncate">
										{invoice.label ?? invoice.clientName}
									</span>
									<span aria-hidden>·</span>
									<span>{date(invoice.issueDate)}</span>
									{invoice.dueDate && (
										<span
											className={cn(
												invoice.displayStatus === "OVERDUE" &&
													"font-medium text-destructive",
											)}
										>
											· {t("due", { date: date(invoice.dueDate) })}
										</span>
									)}
								</p>
							</div>
							<div className="ml-auto flex items-center gap-3 text-xs">
								<div className="flex flex-col items-end gap-0.5">
									<span className="text-sm font-semibold tabular-nums">
										{formatMoney(invoice.total, locale)}
									</span>
									{issued && invoice.balance > 0 && (
										<span className="text-[11px] text-muted-foreground tabular-nums">
											{t("balance", {
												amount: formatMoney(invoice.balance, locale),
											})}
										</span>
									)}
									{partial && (
										<span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
											<span
												className="block h-full rounded-full bg-primary"
												style={{
													width: `${Math.round((invoice.paid / invoice.total) * 100)}%`,
												}}
											/>
										</span>
									)}
								</div>
								<InvoiceStatusBadge status={invoice.displayStatus} />
								<ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
							</div>
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
