import { cn } from "@/lib/utils";

interface BreakdownRow {
	key: string;
	label: string;
	count: number;
	/** Tailwind background class of the bar. */
	bar: string;
}

interface BreakdownCardProps {
	title: string;
	rows: BreakdownRow[];
	empty: string;
}

/** How a total splits up (by status, by stage), with proportional bars; empty rows are left out. */
export function BreakdownCard({ title, rows, empty }: BreakdownCardProps) {
	const total = rows.reduce((sum, row) => sum + row.count, 0);
	const filled = rows.filter((row) => row.count > 0);

	return (
		<section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
			<h2 className="text-sm font-semibold">{title}</h2>
			{total === 0 ? (
				<p className="py-3 text-center text-xs text-muted-foreground">
					{empty}
				</p>
			) : (
				<ul className="flex flex-col gap-1.5">
					{filled.map((row) => (
						<li key={row.key} className="flex flex-col gap-1">
							<div className="flex items-center justify-between text-xs">
								<span>{row.label}</span>
								<span className="font-medium tabular-nums">{row.count}</span>
							</div>
							<div className="h-1 overflow-hidden rounded-full bg-muted">
								<div
									className={cn(
										"h-full rounded-full transition-all duration-500",
										row.bar,
									)}
									style={{ width: `${(row.count / total) * 100}%` }}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
