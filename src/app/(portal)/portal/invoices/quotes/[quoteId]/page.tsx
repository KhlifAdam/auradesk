import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PrintButton } from "@/components/invoices/print-button";
import { QuoteDocument } from "@/components/invoices/quote-document";
import { QuoteResponse } from "@/components/portal/quote-response";
import { requireClient } from "@/lib/auth/require-client";
import { getClientQuote } from "@/services/quotes/queries";

/** A quote the studio sent to the client, to accept or decline. */
export default async function PortalQuotePage({
	params,
}: {
	params: Promise<{ quoteId: string }>;
}) {
	const t = await getTranslations("Quotes.portal");
	const { quoteId } = await params;
	const { clientId } = await requireClient();
	const quote = await getClientQuote(clientId, quoteId);
	if (!quote) notFound();

	return (
		<>
			<div className="flex items-center justify-between gap-2 print:hidden">
				<Link
					href="/portal/invoices"
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<PrintButton />
			</div>
			{quote.status === "SENT" && !quote.invoiceId && (
				<QuoteResponse quoteId={quote.id} />
			)}
			<QuoteDocument quote={quote} />
		</>
	);
}
