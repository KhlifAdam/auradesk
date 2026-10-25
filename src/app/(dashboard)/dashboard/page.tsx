import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { z } from "zod";
import {
	AssistantCard,
	AssistantCardSkeleton,
} from "@/components/dashboard/overview/assistant-card";
import { LatestUploads } from "@/components/dashboard/overview/latest-uploads";
import {
	MoneyCard,
	MoneyCardSkeleton,
} from "@/components/dashboard/overview/money-card";
import { OverviewHeader } from "@/components/dashboard/overview/overview-header";
import { SetupChecklist } from "@/components/dashboard/overview/setup-checklist";
import { StatCard } from "@/components/dashboard/overview/stat-card";
import { PeriodFilter } from "@/components/dashboard/overview/stats/period-filter";
import {
	StatisticsSection,
	StatisticsSkeleton,
} from "@/components/dashboard/overview/stats/statistics-section";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { PERIODS, resolvePeriod } from "@/services/overview/period";
import { getOverview } from "@/services/overview/queries";

const paramsSchema = z.object({
	period: z.enum(PERIODS).catch("month"),
	from: z.string().optional().catch(undefined),
	to: z.string().optional().catch(undefined),
});

interface OverviewPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverviewPage({
	searchParams,
}: OverviewPageProps) {
	const t = await getTranslations("Dashboard.Overview");
	const params = paramsSchema.parse(await searchParams);
	const { session, photographerId } = await requirePhotographer();
	const [overview, timeZone, locale] = await Promise.all([
		getOverview(photographerId),
		getRequestTimeZone(),
		getLocale(),
	]);
	const { studio, counts } = overview;

	// Weeks start on Monday in French and on Sunday in English, as in the calendar.
	const period = resolvePeriod(params, timeZone, locale === "fr" ? 1 : 0);
	const siteStatus = !studio ? "notSetUp" : studio.published ? "live" : "draft";

	return (
		<PageShell>
			<OverviewHeader
				userName={session.user.name}
				hasStudio={studio !== null}
			/>

			<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
				<Suspense fallback={<AssistantCardSkeleton />}>
					<AssistantCard />
				</Suspense>
				<Suspense fallback={<MoneyCardSkeleton />}>
					<MoneyCard />
				</Suspense>
			</div>

			<section className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="text-sm font-semibold">{t("statistics.title")}</h2>
					<PeriodFilter
						active={period.key}
						firstDay={period.firstDay}
						lastDay={period.lastDay}
					/>
				</div>
				<Suspense
					key={`${period.key}-${period.firstDay}-${period.lastDay}`}
					fallback={<StatisticsSkeleton />}
				>
					<StatisticsSection period={period} timeZone={timeZone} />
				</Suspense>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">{t("website.title")}</h2>
				<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
					<StatCard label={t("stats.media")} value={String(counts.media)} />
					<StatCard
						label={t("stats.albums")}
						value={String(counts.albums)}
						detail={t("stats.albumsDetail", {
							published: counts.publishedAlbums,
						})}
					/>
					<StatCard
						label={t("stats.packages")}
						value={String(counts.packages)}
						detail={t("stats.packagesDetail", {
							active: counts.activePackages,
						})}
					/>
					<StatCard
						label={t("stats.site")}
						value={t(`stats.${siteStatus}`)}
						accent={siteStatus === "live"}
					/>
				</div>
				<div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
					<SetupChecklist overview={overview} />
					<div className="xl:col-span-2">
						<LatestUploads items={overview.latestMedia} />
					</div>
				</div>
			</section>
		</PageShell>
	);
}
