import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { QuoteActions } from "@/components/dashboard/quotes/quote-actions";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { QuoteDocument } from "@/components/invoices/quote-document";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getQuote } from "@/services/quotes/queries";

export default async function QuotePage({
	params,
}: {
	params: Promise<{ quoteId: string }>;
}) {
	const t = await getTranslations("Quotes.detail");
	const format = await getFormatter();
	const { quoteId } = await params;
	const { photographerId } = await requirePhotographer();
	const quote = await getQuote(photographerId, quoteId);
	if (!quote) notFound();

	const answered = quote.respondedAt
		? format.dateTime(new Date(quote.respondedAt), { dateStyle: "medium" })
		: "";
	const hint = quote.invoiceNumber
		? t("invoicedHint", { number: quote.invoiceNumber })
		: {
				DRAFT: t("draftHint"),
				SENT: t("waitingHint"),
				ACCEPTED: t("acceptedHint", { date: answered }),
				DECLINED: t("declinedHint", { date: answered }),
			}[quote.status];

	return (
		<PageShell className="print:p-0">
			<Link
				href="/dashboard/invoices/quotes"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground print:hidden"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<div className="print:hidden">
				<PageHeader
					title={quote.number}
					description={quote.clientName}
					actions={
						<QuoteActions
							quoteId={quote.id}
							status={quote.status}
							invoiceId={quote.invoiceId}
						/>
					}
				/>
			</div>
			{quote.bookingId && (
				<Link
					href={`/dashboard/bookings/${quote.bookingId}`}
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground print:hidden"
				>
					{t("fromBooking", { title: quote.bookingTitle ?? "" })}
					<ArrowUpRight className="h-3 w-3" />
				</Link>
			)}
			<p className="max-w-3xl rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground print:hidden">
				{hint}
			</p>
			<QuoteDocument quote={quote} />
		</PageShell>
	);
}
