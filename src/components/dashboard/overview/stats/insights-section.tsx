import { Clock, Hourglass, PackageCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getOverviewInsights } from "@/services/overview/insights";
import type { Period } from "@/services/overview/period";
import { formatMoney } from "@/services/projects/money";
import { Delta } from "./kpi-card";
import { RevenueChart } from "./revenue-chart";

interface InsightsSectionProps {
	photographerId: string;
	period: Period;
	timeZone: string;
}

/** Revenue over time, how long delivery takes, and the most booked services. */
export async function InsightsSection({
	photographerId,
	period,
	timeZone,
}: InsightsSectionProps) {
	const t = await getTranslations("Dashboard.Overview.statistics");
	const tService = await getTranslations("Projects.serviceTypes");
	const locale = await getLocale();
	const { revenue, production, services } = await getOverviewInsights(
		photographerId,
		period,
		timeZone,
	);
	const days = (value: number | null) =>
		value === null
			? "—"
			: t("production.days", { count: Math.round(value * 10) / 10 });
	const topCount = services[0]?.projects ?? 0;

	return (
		<div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
			<section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 xl:col-span-2">
				<div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
					<div className="flex flex-col">
						<h2 className="text-sm font-semibold">{t("revenue.title")}</h2>
						<span className="text-[11px] text-muted-foreground">
							{t("revenue.hint")}
						</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="font-display text-lg font-bold tracking-tight text-primary">
							{formatMoney(revenue.total.value, locale)}
						</span>
						<Delta
							compared={revenue.total}
							versus={period.previous ? t("vsPrevious") : undefined}
						/>
					</div>
				</div>
				<RevenueChart
					series={revenue.series}
					granularity={period.granularity}
				/>
			</section>

			<div className="flex flex-col gap-3">
				<section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
					<h2 className="text-sm font-semibold">{t("production.title")}</h2>
					<dl className="grid grid-cols-3 gap-2">
						{[
							{
								icon: Hourglass,
								label: t("production.fromShoot"),
								value: days(production.fromShoot),
							},
							{
								icon: Clock,
								label: t("production.fromStart"),
								value: days(production.fromStart),
							},
							{
								icon: PackageCheck,
								label: t("production.delivered"),
								value: production.delivered.toLocaleString(locale),
							},
						].map(({ icon: Icon, label, value }) => (
							<div
								key={label}
								className="flex flex-col gap-1 rounded-lg bg-muted/50 px-2 py-2"
							>
								<dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
									<Icon className="size-3 shrink-0" />
									<span className="truncate">{label}</span>
								</dt>
								<dd className="font-display text-base font-bold tracking-tight">
									{value}
								</dd>
							</div>
						))}
					</dl>
					{production.previousFromShoot !== null &&
						production.fromShoot !== null && (
							<p className="text-[11px] text-muted-foreground">
								{t("production.before", {
									value: days(production.previousFromShoot),
								})}
							</p>
						)}
				</section>

				<section className="flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-3">
					<h2 className="text-sm font-semibold">{t("services.title")}</h2>
					{services.length === 0 ? (
						<p className="py-3 text-center text-xs text-muted-foreground">
							{t("breakdown.empty")}
						</p>
					) : (
						<ul className="flex flex-col gap-1.5">
							{services.map((row) => (
								<li key={row.service} className="flex flex-col gap-1">
									<div className="flex items-center justify-between gap-2 text-xs">
										<span className="truncate">{tService(row.service)}</span>
										<span className="shrink-0 tabular-nums text-muted-foreground">
											<span className="font-medium text-foreground">
												{t("services.projects", { count: row.projects })}
											</span>
											{row.value > 0 && ` · ${formatMoney(row.value, locale)}`}
										</span>
									</div>
									<div className="h-1 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary transition-all duration-500"
											style={{ width: `${(row.projects / topCount) * 100}%` }}
										/>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</div>
	);
}
