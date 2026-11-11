import { BookImage, FileText, MessageSquareText, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import {
	CARD,
	CARD_GRID,
	CARD_MEDIA,
} from "@/components/dashboard/shared/card-grid";
import { cn } from "@/lib/utils";
import type { StudioOrderSummary } from "@/services/books/types";
import { formatMoney } from "@/services/projects/money";

/** Book orders as cards, newest first; `hideProject` on a project's own page. */
export async function OrderList({
	orders,
	hideProject,
}: {
	orders: StudioOrderSummary[];
	hideProject?: boolean;
}) {
	const t = await getTranslations("BookOrders.list");
	const format = await getFormatter();
	const locale = await getLocale();

	return (
		<ul className={CARD_GRID}>
			{orders.map((order) => (
				<li key={order.id}>
					<Link
						href={`/dashboard/books/${order.id}`}
						className={cn(CARD, "h-full")}
					>
						<div className={CARD_MEDIA}>
							{order.coverUrl ? (
								// Signed private URLs: served as they are.
								<Image
									src={order.coverUrl}
									alt=""
									fill
									unoptimized
									sizes="(min-width: 1280px) 20vw, 33vw"
									className="object-cover"
								/>
							) : (
								<BookImage className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
							)}
						</div>
						<div className="flex flex-1 flex-col gap-1.5 p-2.5">
							<div className="flex items-start justify-between gap-2">
								<span className="truncate text-sm font-medium">
									{order.title}
								</span>
								{order.total !== null && (
									<span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
										{formatMoney(order.total, locale)}
									</span>
								)}
							</div>
							<div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
								<span className="flex min-w-0 items-center gap-1">
									<User className="h-3 w-3 shrink-0" />
									<span className="truncate">
										{hideProject
											? order.clientName
											: `${order.clientName} · ${order.projectTitle}`}
									</span>
								</span>
								<span className="truncate">
									{[
										t("size", { pages: order.pages, copies: order.copies }),
										order.submittedAt &&
											format.dateTime(new Date(order.submittedAt), {
												dateStyle: "medium",
											}),
									]
										.filter(Boolean)
										.join(" · ")}
								</span>
								{order.invoice && (
									<span className="flex items-center gap-1">
										<FileText className="h-3 w-3 shrink-0" />
										{order.invoice.number} ·{" "}
										{t(`invoice.${order.invoice.status}`)}
									</span>
								)}
							</div>
							<div className="mt-auto flex flex-wrap gap-1">
								<BookStatusBadge
									status={order.status}
									awaitingApproval={order.awaitingApproval}
								/>
								{order.changeRequested && (
									<span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
										<MessageSquareText className="h-3 w-3" />
										{t("changeRequested")}
									</span>
								)}
							</div>
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
