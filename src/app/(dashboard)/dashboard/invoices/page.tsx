import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BillingTabs } from "@/components/dashboard/invoices/billing-tabs";
import { InvoiceList } from "@/components/dashboard/invoices/invoice-list";
import {
	InvoiceStatsCards,
	InvoiceStatsSkeleton,
} from "@/components/dashboard/invoices/invoice-stats";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { INVOICE_FILTERS } from "@/services/invoices/options";
import { listInvoices } from "@/services/invoices/queries";
import {
	type ListInvoicesParams,
	listInvoicesSchema,
} from "@/services/invoices/schemas";
import { getInvoiceStats } from "@/services/invoices/stats";

interface InvoicesPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InvoicesPage({
	searchParams,
}: InvoicesPageProps) {
	const t = await getTranslations("Invoices");
	const params = listInvoicesSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={
					<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
						<Link href="/dashboard/invoices/new">
							<Plus className="h-3.5 w-3.5" />
							{t("list.new")}
						</Link>
					</Button>
				}
			/>
			<BillingTabs active="invoices" />
			<Suspense fallback={<InvoiceStatsSkeleton />}>
				<Stats />
			</Suspense>
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("list.search")} />
				<UrlSelectFilter
					param="status"
					active={params.status}
					allLabel={t("list.all")}
					ariaLabel={t("list.filter")}
					options={INVOICE_FILTERS.map((value) => ({
						value,
						label: t(`status.${value}`),
					}))}
				/>
			</div>
			<Suspense
				key={`${params.q}-${params.status}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<Invoices params={params} />
			</Suspense>
		</PageShell>
	);
}

async function Stats() {
	const { photographerId } = await requirePhotographer();
	return <InvoiceStatsCards stats={await getInvoiceStats(photographerId)} />;
}

async function Invoices({ params }: { params: ListInvoicesParams }) {
	const t = await getTranslations("Invoices.empty");
	const { photographerId } = await requirePhotographer();
	const { items, page, pageCount } = await listInvoices(photographerId, params);
	const filtered = Boolean(params.q || params.status);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={Receipt}
				title={filtered ? t("noMatch") : t("title")}
				description={filtered ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<InvoiceList invoices={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
