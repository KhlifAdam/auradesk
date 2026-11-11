import { FileCheck2 } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getProjectQuoteToInvoice } from "@/services/bookings/booking-quote";
import { formatMoney } from "@/services/projects/money";
import { QuoteToInvoiceButton } from "./quote-to-invoice-button";

/** The quote the client accepted, waiting to become the project's invoice. */
export async function ProjectQuoteCallout({
	photographerId,
	projectId,
}: {
	photographerId: string;
	projectId: string;
}) {
	const quote = await getProjectQuoteToInvoice(photographerId, projectId);
	if (!quote) return null;
	const t = await getTranslations("Projects.quote");
	const locale = await getLocale();

	return (
		<section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/5 px-4 py-3">
			<p className="flex items-center gap-2 text-sm">
				<FileCheck2 className="h-4 w-4 shrink-0 text-success" />
				<span>
					{t("accepted", {
						number: quote.number,
						amount: formatMoney(quote.total, locale),
					})}{" "}
					<Link
						href={`/dashboard/invoices/quotes/${quote.id}`}
						className="text-muted-foreground underline-offset-2 hover:underline"
					>
						{t("open")}
					</Link>
				</span>
			</p>
			<QuoteToInvoiceButton quoteId={quote.id} />
		</section>
	);
}
