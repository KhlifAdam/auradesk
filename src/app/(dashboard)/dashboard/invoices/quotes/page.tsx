import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BillingTabs } from "@/components/dashboard/invoices/billing-tabs";
import { QuoteList } from "@/components/dashboard/quotes/quote-list";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { QUOTE_FILTERS } from "@/services/quotes/options";
import { listQuotes } from "@/services/quotes/queries";
import {
	type ListQuotesParams,
	listQuotesSchema,
} from "@/services/quotes/schemas";

interface QuotesPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
	const t = await getTranslations("Quotes");
	const params = listQuotesSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={
					<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
						<Link href="/dashboard/invoices/quotes/new">
							<Plus className="h-3.5 w-3.5" />
							{t("list.new")}
						</Link>
					</Button>
				}
			/>
			<BillingTabs active="quotes" />
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("list.search")} />
				<UrlSelectFilter
					param="status"
					active={params.status}
					allLabel={t("list.all")}
					ariaLabel={t("list.filter")}
					options={QUOTE_FILTERS.map((value) => ({
						value,
						label: t(`status.${value}`),
					}))}
				/>
			</div>
			<Suspense
				key={`${params.q}-${params.status}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<Quotes params={params} />
			</Suspense>
		</PageShell>
	);
}

async function Quotes({ params }: { params: ListQuotesParams }) {
	const t = await getTranslations("Quotes.empty");
	const { photographerId } = await requirePhotographer();
	const { items, page, pageCount } = await listQuotes(photographerId, params);
	const filtered = Boolean(params.q || params.status);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={FileText}
				title={filtered ? t("noMatch") : t("title")}
				description={filtered ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<QuoteList quotes={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
