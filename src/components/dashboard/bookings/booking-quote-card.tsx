import { ArrowUpRight, FileText, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { QuoteStatusBadge } from "@/components/dashboard/quotes/quote-status-badge";
import { QuoteLines } from "@/components/quotes/quote-lines";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getBookingQuote } from "@/services/bookings/booking-quote";
import { quoteDisplayStatus } from "@/services/quotes/options";

/**
 * The booking's price as a quote: its lines (package, drone, reel…), where it
 * stands with the client, and a way to change it before the booking is
 * confirmed. It goes out with the booking.
 */
export async function BookingQuoteCard({
	bookingId,
	confirmed,
}: {
	bookingId: string;
	confirmed: boolean;
}) {
	const t = await getTranslations("Bookings.quote");
	const { photographerId } = await requirePhotographer();
	const quote = await getBookingQuote({ photographerId }, bookingId);

	return (
		<section className="flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 text-sm font-semibold">
					<FileText className="h-4 w-4 text-muted-foreground" />
					{quote ? t("title", { number: quote.number }) : t("titleNone")}
					{quote && (
						<QuoteStatusBadge
							status={quoteDisplayStatus(
								quote.status,
								quote.invoiced ? "invoiced" : null,
							)}
						/>
					)}
				</h2>
				<div className="flex gap-2">
					{!quote && !confirmed && (
						<Button
							asChild
							size="sm"
							variant="outline"
							className="h-7 gap-1.5 text-xs"
						>
							<Link
								href={`/dashboard/invoices/quotes/new?booking=${bookingId}`}
							>
								<Plus className="h-3.5 w-3.5" />
								{t("create")}
							</Link>
						</Button>
					)}
					{quote && !confirmed && !quote.invoiced && (
						<Button
							asChild
							size="sm"
							variant="outline"
							className="h-7 gap-1.5 text-xs"
						>
							<Link
								href={`/dashboard/invoices/quotes/${quote.id}/edit?from=booking`}
							>
								<Pencil className="h-3.5 w-3.5" />
								{t("edit")}
							</Link>
						</Button>
					)}
					{quote && (
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="h-7 gap-1 text-xs"
						>
							<Link href={`/dashboard/invoices/quotes/${quote.id}`}>
								{t("open")}
								<ArrowUpRight className="h-3.5 w-3.5" />
							</Link>
						</Button>
					)}
				</div>
			</div>
			{quote ? (
				<>
					<QuoteLines quote={quote} totalLabel={t("total")} />
					{quote.clientNote && (
						<p className="whitespace-pre-wrap rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
							<span className="font-medium">{t("clientNote")}</span>{" "}
							{quote.clientNote}
						</p>
					)}
					<p className="text-xs text-muted-foreground">
						{confirmed ? t("hint.confirmed") : t(`hint.${quote.status}`)}
					</p>
				</>
			) : (
				<p className="text-xs text-muted-foreground">{t("hint.none")}</p>
			)}
		</section>
	);
}
