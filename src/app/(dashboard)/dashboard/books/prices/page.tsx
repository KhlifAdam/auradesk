import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PriceListForm } from "@/components/dashboard/books/price-list-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getPriceList } from "@/services/books/price-list";

/** The studio's price list for photo books: what clients are quoted as they choose. */
export default async function BookPricesPage() {
	const t = await getTranslations("BookOrders.prices");
	const { photographerId } = await requirePhotographer();
	const priceList = await getPriceList(photographerId);

	return (
		<PageShell>
			<Link
				href="/dashboard/books"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<PageHeader title={t("title")} description={t("description")} />
			<PriceListForm initial={priceList} />
		</PageShell>
	);
}
