import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import type { StudioOrderSummary } from "@/services/books/types";
import { formatMoney } from "@/services/projects/money";

/** The studio's book orders, newest first; each opens its page. */
export async function OrderList({ orders }: { orders: StudioOrderSummary[] }) {
	const t = await getTranslations("BookOrders.list");
	const format = await getFormatter();
	const locale = await getLocale();

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{orders.map((order) => (
				<li key={order.id}>
					<Link
						href={`/dashboard/books/${order.id}`}
						className="flex items-center gap-4 px-3 py-2.5 transition-colors hover:bg-muted/50"
					>
						<div className="flex min-w-0 flex-1 flex-col">
							<p className="truncate text-sm font-medium">{order.title}</p>
							<p className="truncate text-xs text-muted-foreground">
								{[
									order.clientName,
									order.projectTitle,
									t("size", { pages: order.pages, copies: order.copies }),
									order.submittedAt &&
										format.dateTime(new Date(order.submittedAt), {
											dateStyle: "medium",
										}),
								]
									.filter(Boolean)
									.join(" · ")}
							</p>
						</div>
						<div className="hidden flex-col items-end gap-0.5 sm:flex">
							{order.total !== null && (
								<span className="text-sm font-medium tabular-nums">
									{formatMoney(order.total, locale)}
								</span>
							)}
							{order.invoice && (
								<span className="text-[11px] text-muted-foreground">
									{order.invoice.number} ·{" "}
									{t(`invoice.${order.invoice.status}`)}
								</span>
							)}
						</div>
						<BookStatusBadge status={order.status} />
						<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
					</Link>
				</li>
			))}
		</ul>
	);
}
