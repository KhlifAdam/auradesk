import { ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { QuoteStatusBadge } from "@/components/dashboard/quotes/quote-status-badge";
import { QuoteLines } from "@/components/quotes/quote-lines";
import { getBookingQuote } from "@/services/bookings/booking-quote";
import { quoteDisplayStatus } from "@/services/quotes/options";

/**
 * The studio's price for this request, shown in full: what is included
 * (package, drone, reel…) and the total. Accepting the request accepts it.
 */
export async function BookingQuotes({
	clientId,
	bookingId,
	editable,
}: {
	clientId: string;
	bookingId: string;
	/** The client can still complete and accept the request. */
	editable: boolean;
}) {
	const quote = await getBookingQuote({ clientId }, bookingId);
	if (!quote) return null;
	const t = await getTranslations("Portal.bookings.quote");

	return (
		<section className="flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 text-sm font-semibold">
					<FileText className="h-4 w-4 text-muted-foreground" />
					{t("title", { number: quote.number })}
					<QuoteStatusBadge
						status={quoteDisplayStatus(
							quote.status,
							quote.invoiced ? "invoiced" : null,
						)}
					/>
				</h2>
				<Link
					href={`/portal/invoices/quotes/${quote.id}`}
					className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					{t("open")}
					<ArrowUpRight className="h-3.5 w-3.5" />
				</Link>
			</div>
			<QuoteLines quote={quote} totalLabel={t("total")} />
			{quote.status === "SENT" && (
				<p className="text-xs text-muted-foreground">{t("hint")}</p>
			)}
			{quote.status === "ACCEPTED" && editable && (
				<p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
					{t("completeHint")}
				</p>
			)}
		</section>
	);
}
