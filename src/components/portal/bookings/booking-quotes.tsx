import { getTranslations } from "next-intl/server";
import { QuoteList } from "@/components/dashboard/quotes/quote-list";
import { listClientBookingQuotes } from "@/services/quotes/queries";

/** The studio's quotes for this request, with a way to open and answer them. */
export async function BookingQuotes({
	clientId,
	bookingId,
}: {
	clientId: string;
	bookingId: string;
}) {
	const quotes = await listClientBookingQuotes(clientId, bookingId);
	if (quotes.length === 0) return null;
	const t = await getTranslations("Quotes.portal");

	return (
		<section className="flex max-w-5xl flex-col gap-2">
			<h2 className="text-sm font-semibold">{t("listTitle")}</h2>
			<QuoteList quotes={quotes} hrefBase="/portal/invoices/quotes" />
		</section>
	);
}
