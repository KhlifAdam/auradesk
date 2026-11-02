import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BookingList } from "@/components/dashboard/bookings/booking-list";
import { BookingSortControl } from "@/components/dashboard/bookings/booking-sort";
import {
	BookingStatsCards,
	BookingStatsSkeleton,
} from "@/components/dashboard/bookings/booking-stats";
import { BookingStatusFilter } from "@/components/dashboard/bookings/booking-status-filter";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { ListSkeleton } from "@/components/dashboard/shared/list-skeleton";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { UrlDateRange } from "@/components/dashboard/shared/url-date-range";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { UrlSearch } from "@/components/dashboard/shared/url-search";
import { Button } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getBookingStats, listBookings } from "@/services/bookings/queries";
import {
	type ListBookingsParams,
	listBookingsSchema,
} from "@/services/bookings/schemas";

interface BookingsPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingsPage({
	searchParams,
}: BookingsPageProps) {
	const t = await getTranslations("Bookings");
	const params = listBookingsSchema.parse(await searchParams);

	return (
		<PageShell>
			<PageHeader
				title={t("title")}
				description={t("description")}
				actions={
					<Button asChild size="sm" className="h-8 gap-1.5 text-xs">
						<Link href="/dashboard/bookings/new">
							<Plus className="h-3.5 w-3.5" />
							{t("list.new")}
						</Link>
					</Button>
				}
			/>
			<Suspense fallback={<BookingStatsSkeleton />}>
				<Stats />
			</Suspense>
			<div className="flex flex-wrap items-center gap-2">
				<UrlSearch placeholder={t("list.search")} />
				<BookingStatusFilter active={params.status} />
				<UrlDateRange
					from={params.from}
					to={params.to}
					labels={{
						from: t("list.dateFrom"),
						to: t("list.dateTo"),
						clear: t("list.dateClear"),
					}}
				/>
				<BookingSortControl sort={params.sort} order={params.order} />
			</div>
			<Suspense
				key={[
					params.q,
					params.status,
					params.from,
					params.to,
					params.sort,
					params.order,
					params.page,
				].join("-")}
				fallback={<ListSkeleton />}
			>
				<Bookings params={params} />
			</Suspense>
		</PageShell>
	);
}

async function Stats() {
	const { photographerId } = await requirePhotographer();
	return <BookingStatsCards stats={await getBookingStats(photographerId)} />;
}

async function Bookings({ params }: { params: ListBookingsParams }) {
	const t = await getTranslations("Bookings.empty");
	const { photographerId } = await requirePhotographer();
	const { items, page, pageCount } = await listBookings(photographerId, params);
	const filtered = Boolean(
		params.q || params.status || params.from || params.to,
	);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={BookOpen}
				title={filtered ? t("noMatch") : t("title")}
				description={filtered ? undefined : t("description")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<BookingList bookings={items} />
			<UrlPagination page={page} pageCount={pageCount} />
		</div>
	);
}
