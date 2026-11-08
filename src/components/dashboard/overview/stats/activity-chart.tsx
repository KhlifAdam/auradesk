"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface ActivityChartProps {
	series: { key: string; bookings: number; projects: number }[];
	granularity: "day" | "month";
}

/** New bookings and new projects over time, one bar group per day or month. */
export function ActivityChart({ series, granularity }: ActivityChartProps) {
	const t = useTranslations("Dashboard.Overview.statistics.chart");
	const locale = useLocale();
	const config: ChartConfig = {
		bookings: { label: t("bookings"), color: "var(--primary)" },
		projects: { label: t("projects"), color: "var(--event-meeting)" },
	};

	// Bucket keys are plain dates, so they are formatted as UTC to stay put.
	const label = (key: string, long = false) =>
		new Intl.DateTimeFormat(
			locale,
			granularity === "day"
				? long
					? { dateStyle: "full", timeZone: "UTC" }
					: { day: "numeric", month: "short", timeZone: "UTC" }
				: long
					? { month: "long", year: "numeric", timeZone: "UTC" }
					: { month: "short", timeZone: "UTC" },
		).format(
			new Date(
				granularity === "day" ? `${key}T12:00:00Z` : `${key}-15T12:00:00Z`,
			),
		);

	const empty = series.every((point) => point.bookings + point.projects === 0);

	return (
		<div className="relative">
			<ChartContainer config={config} className="h-44 w-full">
				<BarChart data={series} margin={{ left: -20, right: 4, top: 4 }}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="key"
						tickLine={false}
						axisLine={false}
						tickMargin={6}
						minTickGap={16}
						tickFormatter={(key: string) => label(key)}
						className="text-[10px]"
					/>
					<YAxis
						allowDecimals={false}
						tickLine={false}
						axisLine={false}
						width={36}
						className="text-[10px]"
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								labelFormatter={(key) => label(String(key), true)}
							/>
						}
					/>
					<ChartLegend content={<ChartLegendContent />} />
					<Bar dataKey="bookings" fill="var(--color-bookings)" radius={3} />
					<Bar dataKey="projects" fill="var(--color-projects)" radius={3} />
				</BarChart>
			</ChartContainer>
			{empty && (
				<p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
					{t("empty")}
				</p>
			)}
		</div>
	);
}
