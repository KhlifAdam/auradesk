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
import type { SignupPoint } from "@/services/admin/insights";

/** New photographers and clients per month, the last 12 months. */
export function SignupChart({ series }: { series: SignupPoint[] }) {
	const t = useTranslations("Admin.growth");
	const locale = useLocale();
	const config: ChartConfig = {
		photographers: { label: t("photographers"), color: "var(--primary)" },
		clients: { label: t("clients"), color: "var(--event-meeting)" },
	};
	// Keys are plain months ("2026-10"), formatted in UTC so they stay put.
	const label = (key: string, long = false) =>
		new Intl.DateTimeFormat(locale, {
			month: long ? "long" : "short",
			...(long && { year: "numeric" }),
			timeZone: "UTC",
		}).format(new Date(`${key}-15T12:00:00Z`));
	const empty = series.every((p) => p.photographers + p.clients === 0);

	return (
		<section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
			<div>
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<p className="text-xs text-muted-foreground">{t("hint")}</p>
			</div>
			<div className="relative">
				<ChartContainer config={config} className="h-56 w-full">
					<BarChart data={series} margin={{ left: -20, right: 4, top: 4 }}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="key"
							tickLine={false}
							axisLine={false}
							tickMargin={6}
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
						<Bar
							dataKey="photographers"
							fill="var(--color-photographers)"
							radius={3}
						/>
						<Bar dataKey="clients" fill="var(--color-clients)" radius={3} />
					</BarChart>
				</ChartContainer>
				{empty && (
					<p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
						{t("empty")}
					</p>
				)}
			</div>
		</section>
	);
}
