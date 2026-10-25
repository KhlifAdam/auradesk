"use client";

import { ArrowLeft, Loader2, Receipt, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { pageCount } from "@/lib/books/design";
import { withdrawBook } from "@/services/books/order-actions";
import type { BookView } from "@/services/books/types";
import { formatMoney } from "@/services/projects/money";
import { BookStatusBadge } from "./book-status-badge";
import { OrderTimeline } from "./order-timeline";
import { QuoteSummary } from "./quote-summary";
import { SpreadGallery } from "./spread-gallery";

/** A book that has been sent to the studio: where it stands, what it costs, what was ordered. */
export function BookOrderView({ book }: { book: BookView }) {
	const t = useTranslations("PhotoBook.view");
	const router = useRouter();
	const locale = useLocale();
	const format = useFormatter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();
	const { order, design, studioName } = book;
	const { invoice } = order;
	const money = (value: number) => formatMoney(value, locale);

	const withdraw = () =>
		startTransition(async () => {
			const result = await withdrawBook(book.id);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("withdrawn"));
			router.refresh();
		});

	const banner =
		order.status === "SUBMITTED"
			? t("submitted", { studio: studioName })
			: order.status === "ACCEPTED"
				? invoice?.status === "PAID"
					? t("acceptedPaid", { studio: studioName })
					: t("accepted", { studio: studioName, number: invoice?.number ?? "" })
				: t(
						order.status === "IN_PRODUCTION"
							? "production"
							: order.status === "READY"
								? "ready"
								: "delivered",
						{
							studio: studioName,
						},
					);

	return (
		<div className="flex flex-col gap-5">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<Link
						href={`/portal/projects/${book.projectId}`}
						className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						{book.projectTitle}
					</Link>
					<h1 className="truncate font-display text-2xl font-bold tracking-tight">
						{design.title}
					</h1>
				</div>
				<BookStatusBadge status={order.status} className="mt-1" />
			</header>

			<section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
				<OrderTimeline status={order.status} />
				<p className="text-sm">{banner}</p>
				{order.submittedAt && (
					<p className="text-xs text-muted-foreground">
						{t("sentOn", {
							date: format.dateTime(new Date(order.submittedAt), {
								dateStyle: "medium",
							}),
						})}
					</p>
				)}
				<div className="flex flex-wrap gap-2">
					{order.status === "SUBMITTED" && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="gap-1.5"
							disabled={pending}
							onClick={withdraw}
						>
							{pending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Undo2 className="h-4 w-4" />
							)}
							{t("withdraw")}
						</Button>
					)}
					{invoice && (
						<Button asChild size="sm" className="gap-1.5">
							<Link href={`/portal/invoices/${invoice.id}`}>
								<Receipt className="h-4 w-4" />
								{t("openInvoice", { number: invoice.number })}
							</Link>
						</Button>
					)}
				</div>
				{invoice && invoice.status !== "PAID" && (
					<p className="text-xs text-muted-foreground">
						{t("balance", {
							amount: money(Math.max(0, invoice.total - invoice.paid)),
						})}
					</p>
				)}
			</section>

			<div className="grid gap-4 md:grid-cols-2">
				{order.quote && (
					<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
						<h2 className="text-sm font-semibold">{t("price")}</h2>
						<QuoteSummary
							quote={order.quote}
							format={design.format}
							pages={pageCount(design)}
							charged={order.total}
						/>
					</section>
				)}
				{order.clientNote && (
					<section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
						<h2 className="text-sm font-semibold">{t("yourNote")}</h2>
						<p className="whitespace-pre-wrap text-sm text-muted-foreground">
							{order.clientNote}
						</p>
					</section>
				)}
			</div>

			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">{t("yourBook")}</h2>
				<SpreadGallery design={design} photos={book.photos} />
			</section>
		</div>
	);
}
