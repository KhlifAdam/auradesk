"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";

interface UrlDateRangeProps {
	from?: string;
	to?: string;
	labels: { from: string; to: string; clear: string };
}

/** Two date inputs kept in `?from=&to=` (`yyyy-MM-dd`). */
export function UrlDateRange({ from, to, labels }: UrlDateRangeProps) {
	const update = useUpdateSearchParams();

	return (
		<div className="flex items-center gap-1.5">
			<Input
				type="date"
				value={from ?? ""}
				max={to}
				onChange={(event) => update({ from: event.target.value || null })}
				aria-label={labels.from}
				title={labels.from}
				className="h-8 w-36 text-xs"
			/>
			<span className="text-xs text-muted-foreground">→</span>
			<Input
				type="date"
				value={to ?? ""}
				min={from}
				onChange={(event) => update({ to: event.target.value || null })}
				aria-label={labels.to}
				title={labels.to}
				className="h-8 w-36 text-xs"
			/>
			{(from || to) && (
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => update({ from: null, to: null })}
					aria-label={labels.clear}
					title={labels.clear}
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
}
