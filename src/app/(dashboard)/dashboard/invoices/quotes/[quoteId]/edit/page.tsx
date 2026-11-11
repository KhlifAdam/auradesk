import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { QuoteForm } from "@/components/dashboard/quotes/form/quote-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { quoteToValues } from "@/services/quotes/form-values";
import { getQuote } from "@/services/quotes/queries";

export default async function EditQuotePage({
	params,
	searchParams,
}: {
	params: Promise<{ quoteId: string }>;
	searchParams: Promise<{ from?: string }>;
}) {
	const t = await getTranslations("Quotes.form");
	const { quoteId } = await params;
	const { from } = await searchParams;
	const { photographerId } = await requirePhotographer();
	const quote = await getQuote(photographerId, quoteId);
	if (!quote) notFound();
	// Opened from its booking: saving goes back there.
	const backHref =
		from === "booking" && quote.bookingId
			? `/dashboard/bookings/${quote.bookingId}`
			: `/dashboard/invoices/quotes/${quote.id}`;
	// Answered or invoiced quotes are final, except a booking's accepted quote
	// before the booking is confirmed (it then has no project yet).
	const openBookingQuote =
		quote.status === "ACCEPTED" && quote.bookingId && !quote.projectId;
	if (
		quote.invoiceId ||
		(quote.status !== "DRAFT" && quote.status !== "SENT" && !openBookingQuote)
	)
		redirect(backHref);

	return (
		<PageShell>
			<Link
				href={backHref}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("backToQuote")}
			</Link>
			<PageHeader
				title={t("editTitle", { number: quote.number })}
				description={t("description")}
			/>
			<QuoteForm
				initial={quoteToValues(quote)}
				projectTitle={quote.projectTitle}
				quoteId={quote.id}
				backHref={backHref}
			/>
		</PageShell>
	);
}
