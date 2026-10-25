import { BookImage, Tag } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NewBookDialog } from "@/components/dashboard/books/new-book-dialog";
import { OrderList } from "@/components/dashboard/books/order-list";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { listBookOrders } from "@/services/books/order-queries";
import {
	type ListOrdersParams,
	listOrdersSchema,
} from "@/services/books/order-schemas";
import { getPriceList } from "@/services/books/price-list";
import { STUDIO_LIST_STATUSES } from "@/services/books/types";

/** Photo books clients have sent to be printed, and the studio's prices for them. */
export default async function BookOrdersPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const t = await getTranslations("BookOrders");
	const tStatus = await getTranslations("PhotoBook.status");
	const params = listOrdersSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={
					<div className="flex items-center gap-2">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-xs"
						>
							<Link href="/dashboard/books/prices">
								<Tag className="h-3.5 w-3.5" />
								{t("pricesButton")}
							</Link>
						</Button>
						<NewBookDialog />
					</div>
				}
			/>
			<Suspense fallback={null}>
				<ClosedNotice />
			</Suspense>
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("search")} />
				<UrlSelectFilter
					param="status"
					active={params.status}
					allLabel={t("all")}
					ariaLabel={t("filter")}
					options={STUDIO_LIST_STATUSES.map((value) => ({
						value,
						label: tStatus(value),
					}))}
				/>
			</div>
			<Suspense
				key={`${params.q}-${params.status}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<Orders params={params} />
			</Suspense>
		</PageShell>
	);
}

/** Reminds a studio that clients can't order until it opens book orders. */
async function ClosedNotice() {
	const t = await getTranslations("BookOrders");
	const { photographerId } = await requirePhotographer();
	if ((await getPriceList(photographerId)).enabled) return null;
	return (
		<p className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
			{t("closed")}
			<Link
				href="/dashboard/books/prices"
				className="font-medium text-primary underline-offset-2 hover:underline"
			>
				{t("openPrices")}
			</Link>
		</p>
	);
}

async function Orders({ params }: { params: ListOrdersParams }) {
	const t = await getTranslations("BookOrders.empty");
	const { photographerId } = await requirePhotographer();
	const { items, page, pageCount } = await listBookOrders(
		photographerId,
		params,
	);

	if (items.length === 0)
		return (
			<EmptyState
				icon={BookImage}
				title={params.q || params.status ? t("noMatch") : t("title")}
				description={params.q || params.status ? undefined : t("description")}
			/>
		);
	return (
		<div className="flex flex-col gap-4">
			<OrderList orders={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
