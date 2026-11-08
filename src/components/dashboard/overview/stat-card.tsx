import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string;
	detail?: string;
	accent?: boolean;
}

export function StatCard({
	label,
	value,
	detail,
	accent = false,
}: StatCardProps) {
	return (
		<div className="group relative flex flex-col gap-0.5 overflow-hidden rounded-xl border border-border bg-card px-3 py-2.5 lift-hover">
			{accent && (
				<div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
			)}
			<span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</span>
			<span
				className={cn(
					"text-lg font-bold tracking-tight transition-colors duration-300",
					accent ? "text-primary" : "text-foreground group-hover:text-primary",
				)}
			>
				{value}
			</span>
			{detail && (
				<span className="text-[11px] text-muted-foreground">{detail}</span>
			)}
		</div>
	);
}

export function StatCardSkeleton() {
	return (
		<div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3">
			<div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
			<div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
			<div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
		</div>
	);
}
