"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SegmentedControl } from "@/components/dashboard/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERIODS, type PeriodKey } from "@/services/overview/period";

// "Last 30 days" overlapped "This month", so the filter leaves it out.
const FILTER_PERIODS = PERIODS.filter((period) => period !== "last30");

interface PeriodFilterProps {
	active: PeriodKey;
	/** The range currently shown, to prefill the custom dates. */
	firstDay: string | null;
	lastDay: string | null;
}

/** Period kept in the URL (`?period=` and, for a custom range, `?from&to`). */
export function PeriodFilter({ active, firstDay, lastDay }: PeriodFilterProps) {
	const t = useTranslations("Dashboard.Overview.statistics");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [custom, setCustom] = useState(active === "custom");
	const [from, setFrom] = useState(firstDay ?? "");
	const [to, setTo] = useState(lastDay ?? "");

	function go(period: PeriodKey, range?: { from: string; to: string }) {
		const params = new URLSearchParams(searchParams);
		params.set("period", period);
		if (range) {
			params.set("from", range.from);
			params.set("to", range.to);
		} else {
			params.delete("from");
			params.delete("to");
		}
		router.replace(`${pathname}?${params}`, { scroll: false });
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<SegmentedControl<PeriodKey>
				value={custom ? "custom" : active}
				onChange={(next) => {
					setCustom(next === "custom");
					if (next !== "custom") go(next);
				}}
				options={FILTER_PERIODS.map((value) => ({
					value,
					label: t(`periods.${value}`),
				}))}
			/>
			{custom && (
				<form
					className="flex flex-wrap items-center gap-1.5"
					onSubmit={(event) => {
						event.preventDefault();
						if (from && to) go("custom", { from, to });
					}}
				>
					<Input
						type="date"
						value={from}
						max={to || undefined}
						onChange={(event) => setFrom(event.target.value)}
						aria-label={t("from")}
						className="h-8 w-36 text-xs"
					/>
					<span className="text-xs text-muted-foreground">→</span>
					<Input
						type="date"
						value={to}
						min={from || undefined}
						onChange={(event) => setTo(event.target.value)}
						aria-label={t("to")}
						className="h-8 w-36 text-xs"
					/>
					<Button
						type="submit"
						size="sm"
						className="h-8 text-xs"
						disabled={!from || !to}
					>
						{t("apply")}
					</Button>
				</form>
			)}
		</div>
	);
}
