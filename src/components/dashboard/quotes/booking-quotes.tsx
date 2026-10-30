import { getTranslations } from "next-intl/server";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { listBookingQuotes } from "@/services/quotes/queries";
import { QuoteList } from "./quote-list";

/** The quotes made for a booking, under its header; nothing when there are none. */
export async function BookingQuotes({ bookingId }: { bookingId: string }) {
	const t = await getTranslations("Quotes");
	const { photographerId } = await requirePhotographer();
	const quotes = await listBookingQuotes(photographerId, bookingId);
	if (quotes.length === 0) return null;

	return (
		<section className="flex max-w-3xl flex-col gap-2">
			<h2 className="text-sm font-semibold">{t("bookingSection")}</h2>
			<QuoteList quotes={quotes} />
		</section>
	);
}
