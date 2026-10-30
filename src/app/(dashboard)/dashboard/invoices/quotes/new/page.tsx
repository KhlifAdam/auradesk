import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { QuoteForm } from "@/components/dashboard/quotes/form/quote-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { emptyQuoteValues } from "@/services/quotes/form-values";
import { quotePrefillFromBooking } from "@/services/quotes/prefill";

interface NewQuotePageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewQuotePage({
	searchParams,
}: NewQuotePageProps) {
	const t = await getTranslations("Quotes.form");
	const { photographerId } = await requirePhotographer();
	const { booking: bookingId } = await searchParams;

	// Coming from a booking: quote its client at the proposed price.
	const prefill =
		typeof bookingId === "string"
			? await quotePrefillFromBooking(photographerId, bookingId)
			: null;
	const backHref = prefill
		? `/dashboard/bookings/${bookingId}`
		: "/dashboard/invoices/quotes";

	return (
		<PageShell>
			<Link
				href={backHref}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader
				title={t("createTitle")}
				description={
					prefill
						? t("forBooking", { title: prefill.bookingTitle })
						: t("description")
				}
			/>
			<QuoteForm
				initial={emptyQuoteValues(prefill?.values)}
				projectTitle={null}
				backHref={backHref}
			/>
		</PageShell>
	);
}
