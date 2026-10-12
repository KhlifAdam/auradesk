import { cn } from "@/lib/utils";

export interface StatItem {
	label: string;
	value: string | number;
	/** Text colour class of the value, e.g. `text-success`. */
	tone?: string;
}

/** A row of compact figures at the top of a list page. */
export function StatCards({ items }: { items: StatItem[] }) {
	return (
		<dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{items.map(({ label, value, tone }) => (
				<div
					key={label}
					className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5"
				>
					<dt className="text-xs text-muted-foreground">{label}</dt>
					<dd
						className={cn(
							"font-display text-2xl font-bold",
							tone ?? "text-foreground",
						)}
					>
						{value}
					</dd>
				</div>
			))}
		</dl>
	);
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{Array.from({ length: count }, (_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					key={i}
					className="h-16 animate-pulse rounded-xl border border-border bg-muted/50"
				/>
			))}
		</div>
	);
}
