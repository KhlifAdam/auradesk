import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EquipmentList } from "@/components/dashboard/equipment/equipment-list";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import {
	StatCards,
	StatCardsSkeleton,
} from "@/components/dashboard/shared/stat-cards";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { UrlSelectFilter } from "@/components/dashboard/shared/url-select-filter";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import {
	AVAILABILITY_FILTERS,
	EQUIPMENT_CATEGORIES,
} from "@/services/equipment/options";
import { getEquipmentStats, listEquipment } from "@/services/equipment/queries";
import {
	type ListEquipmentParams,
	listEquipmentSchema,
} from "@/services/equipment/schemas";

interface EquipmentPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EquipmentPage({
	searchParams,
}: EquipmentPageProps) {
	const t = await getTranslations("Equipment");
	const params = listEquipmentSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={
					<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
						<Link href="/dashboard/equipment/new">
							<Plus className="h-3.5 w-3.5" />
							{t("list.new")}
						</Link>
					</Button>
				}
			/>
			<Suspense fallback={<StatCardsSkeleton />}>
				<Stats />
			</Suspense>
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("list.search")} />
				<UrlSelectFilter
					param="category"
					active={params.category}
					allLabel={t("list.allCategories")}
					ariaLabel={t("list.category")}
					options={EQUIPMENT_CATEGORIES.map((value) => ({
						value,
						label: t(`categories.${value}`),
					}))}
				/>
				<UrlSelectFilter
					param="availability"
					active={params.availability}
					allLabel={t("list.anyAvailability")}
					ariaLabel={t("list.availability")}
					options={AVAILABILITY_FILTERS.map((value) => ({
						value,
						label: t(`filters.${value}`),
					}))}
				/>
			</div>
			<Suspense
				key={`${params.q}-${params.category}-${params.availability}-${params.page}`}
				fallback={<ListSkeleton />}
			>
				<Items params={params} />
			</Suspense>
		</PageShell>
	);
}

async function Stats() {
	const t = await getTranslations("Equipment.stats");
	const { photographerId } = await requirePhotographer();
	const stats = await getEquipmentStats(photographerId);
	return (
		<StatCards
			items={[
				{ label: t("total"), value: stats.total },
				{ label: t("available"), value: stats.available, tone: "text-success" },
				{ label: t("busy"), value: stats.busy, tone: "text-primary" },
				{
					label: t("unavailable"),
					value: stats.unavailable,
					tone: "text-destructive",
				},
			]}
		/>
	);
}

async function Items({ params }: { params: ListEquipmentParams }) {
	const t = await getTranslations("Equipment.empty");
	const { photographerId } = await requirePhotographer();
	const { items, page, pageCount } = await listEquipment(
		photographerId,
		params,
	);
	const filtered = Boolean(params.q || params.category || params.availability);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={Package}
				title={filtered ? t("noMatch") : t("title")}
				description={filtered ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<EquipmentList items={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
