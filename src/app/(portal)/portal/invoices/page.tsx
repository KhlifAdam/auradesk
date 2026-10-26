import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { InvoiceList } from "@/components/dashboard/invoices/invoice-list";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { requireClient } from "@/lib/auth/require-client";
import { cn } from "@/lib/utils";
import {
	getClientInvoiceDue,
	listClientInvoicePage,
} from "@/services/invoices/client-queries";
import { CLIENT_INVOICE_FILTERS } from "@/services/invoices/options";
import {
	type ListClientInvoicesParams,
	listClientInvoicesSchema,
} from "@/services/invoices/schemas";
import { formatMoney } from "@/services/projects/money";

interface PortalInvoicesPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Every invoice the client received, from all their studios. */
export default async function PortalInvoicesPage({
	searchParams,
}: PortalInvoicesPageProps) {
	const t = await getTranslations("Portal.invoices");
	const params = listClientInvoicesSchema.parse(await searchParams);

	return (
		<>
			<div className="flex flex-col gap-1">
				<Link
					href="/portal"
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{t("title")}
				</h1>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
			</div>
			<Suspense
				fallback={<div className="h-16 animate-pulse rounded-xl bg-muted" />}
			>
				<Due />
			</Suspense>
			<UrlSelectFilter
				param="status"
				active={params.status}
				allLabel={t("all")}
				ariaLabel={t("filter")}
				options={CLIENT_INVOICE_FILTERS.map((value) => ({
					value,
					label: t(`filters.${value}`),
				}))}
			/>
			<Suspense
				key={`${params.status}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<Invoices params={params} />
			</Suspense>
		</>
	);
}

async function Due() {
	const t = await getTranslations("Portal.invoices.due");
	const locale = await getLocale();
	const { clientId } = await requireClient();
	const { due, unpaidCount, overdueCount } =
		await getClientInvoiceDue(clientId);

	return (
		<dl className="grid grid-cols-2 gap-3 sm:max-w-md">
			<div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5">
				<dt className="text-xs text-muted-foreground">{t("amount")}</dt>
				<dd
					className={cn(
						"font-display text-xl font-bold",
						due > 0 ? "text-primary" : "text-success",
					)}
				>
					{formatMoney(due, locale)}
				</dd>
			</div>
			<div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5">
				<dt className="text-xs text-muted-foreground">{t("count")}</dt>
				<dd className="font-display text-xl font-bold">
					{unpaidCount}
					{overdueCount > 0 && (
						<span className="ml-2 text-xs font-medium text-destructive">
							{t("overdue", { count: overdueCount })}
						</span>
					)}
				</dd>
			</div>
		</dl>
	);
}

async function Invoices({ params }: { params: ListClientInvoicesParams }) {
	const t = await getTranslations("Portal.invoices.empty");
	const { clientId } = await requireClient();
	const { items, page, pageCount } = await listClientInvoicePage(
		clientId,
		params,
	);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={Receipt}
				title={params.status ? t("noMatch") : t("title")}
				description={params.status ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<InvoiceList invoices={items} hrefBase="/portal/invoices" />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
