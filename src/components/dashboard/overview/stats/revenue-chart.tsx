"use client";

import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatMoney } from "@/services/projects/money";
import { useBucketLabel } from "./use-bucket-label";

interface RevenueChartProps {
	series: { key: string; revenue: number }[];
	granularity: "day" | "month";
}

/** Money received on invoices over time, one point per day or month. */
export function RevenueChart({ series, granularity }: RevenueChartProps) {
	const t = useTranslations("Dashboard.Overview.statistics.revenue");
	const locale = useLocale();
	const label = useBucketLabel(granularity);
	const config: ChartConfig = {
		revenue: { label: t("series"), color: "var(--primary)" },
	};
	const compact = new Intl.NumberFormat(locale, { notation: "compact" });
	const empty = series.every((point) => point.revenue === 0);

	return (
		<div className="relative">
			<ChartContainer config={config} className="h-44 w-full">
				<AreaChart data={series} margin={{ left: -12, right: 4, top: 4 }}>
					<defs>
						<linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="0%"
								stopColor="var(--color-revenue)"
								stopOpacity={0.35}
							/>
							<stop
								offset="100%"
								stopColor="var(--color-revenue)"
								stopOpacity={0}
							/>
						</linearGradient>
					</defs>
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
						tickLine={false}
						axisLine={false}
						width={44}
						tickFormatter={(value: number) => compact.format(value)}
						className="text-[10px]"
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								labelFormatter={(key) => label(String(key), true)}
								formatter={(value) => (
									<span className="font-medium tabular-nums">
										{formatMoney(Number(value), locale)}
									</span>
								)}
							/>
						}
					/>
					<Area
						dataKey="revenue"
						type="monotone"
						stroke="var(--color-revenue)"
						strokeWidth={2}
						fill="url(#revenue-fill)"
					/>
				</AreaChart>
			</ChartContainer>
			{empty && (
				<p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
					{t("empty")}
				</p>
			)}
		</div>
	);
}
