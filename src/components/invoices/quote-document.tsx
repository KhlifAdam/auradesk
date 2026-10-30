import { getFormatter, getTranslations } from "next-intl/server";
import { QuoteStatusBadge } from "@/components/dashboard/quotes/quote-status-badge";
import type { QuoteDetail } from "@/services/quotes/types";
import { DocumentSheet } from "./document-sheet";

/** The quote as a sheet of paper, like an invoice but without payments. */
export async function QuoteDocument({ quote }: { quote: QuoteDetail }) {
	const t = await getTranslations("Quotes.document");
	const format = await getFormatter();
	const date = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "long", timeZone: "UTC" });
	const facts: [string, string][] = [[t("issued"), date(quote.issueDate)]];
	if (quote.validUntil) facts.push([t("validUntil"), date(quote.validUntil)]);
	const about = quote.projectTitle ?? quote.bookingTitle;
	if (about) facts.push([t("about"), about]);

	return (
		<DocumentSheet
			title={t("title")}
			number={quote.number}
			badge={<QuoteStatusBadge status={quote.displayStatus} />}
			issuer={quote.issuer}
			client={{
				name: quote.clientName,
				email: quote.clientEmail,
				phone: quote.clientPhone,
				address: quote.clientAddress,
			}}
			facts={facts}
			items={quote.items}
			totals={quote.totals}
			taxRate={quote.taxRate}
			notes={quote.notes}
		/>
	);
}
