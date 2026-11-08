import {
	ArrowDownRight,
	ArrowUpRight,
	type LucideIcon,
	Minus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Compared } from "@/services/overview/stats";

/** Icon badge colors, from the theme tokens in globals.css. */
const TONES = {
	gold: "bg-primary/15 text-primary",
	blue: "bg-event-meeting/15 text-event-meeting",
	green: "bg-success/15 text-success",
	red: "bg-destructive/15 text-destructive",
	teal: "bg-event-project/15 text-event-project",
	purple: "bg-event-other/15 text-event-other",
	amber: "bg-event-shoot/15 text-event-shoot",
} as const;

export type KpiTone = keyof typeof TONES;

interface KpiCardProps {
	label: string;
	value: string;
	icon: LucideIcon;
	tone: KpiTone;
	/** Figure of the chosen period and the one before; omit for a snapshot. */
	compared?: Compared;
	/** Shown instead of a comparison, e.g. "today". */
	hint?: string;
	/** Text for the comparison line, e.g. "vs previous period". */
	versus?: string;
	href?: string;
	accent?: boolean;
}

function Delta({ compared, versus }: { compared: Compared; versus?: string }) {
	if (compared.previous === null) return null;
	const { value, previous } = compared;
	const diff = value - previous;
	// No base to compute a percentage from: just say what changed.
	const text =
		previous === 0
			? diff === 0
				? "0"
				: `+${diff.toLocaleString()}`
			: `${diff > 0 ? "+" : ""}${Math.round((diff / previous) * 100)}%`;
	const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;

	return (
		<span className="flex items-center gap-1 text-[11px] text-muted-foreground">
			<span
				className={cn(
					"flex items-center gap-0.5 font-medium",
					diff > 0 && "text-success",
					diff < 0 && "text-destructive",
				)}
			>
				<Icon className="h-3 w-3" />
				{text}
			</span>
			{versus}
		</span>
	);
}

/** One figure: the label, the number, and how it moved against the last period. */
export function KpiCard({
	label,
	value,
	icon: Icon,
	tone,
	compared,
	hint,
	versus,
	href,
	accent,
}: KpiCardProps) {
	const body = (
		<>
			<span className="flex items-center justify-between gap-2">
				<span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
					{label}
				</span>
				<span
					className={cn(
						"flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-115",
						TONES[tone],
					)}
				>
					<Icon className="h-3.5 w-3.5" />
				</span>
			</span>
			<span
				className={cn(
					"font-display text-lg font-bold tracking-tight transition-colors duration-300",
					accent ? "text-primary" : "text-foreground group-hover:text-primary",
				)}
			>
				{value}
			</span>
			{compared ? (
				<Delta compared={compared} versus={versus} />
			) : (
				hint && (
					<span className="text-[11px] text-muted-foreground">{hint}</span>
				)
			)}
		</>
	);
	// Hover: lifts a little, glows gold, the icon tilts and the figure turns gold.
	const className =
		"group flex min-w-0 flex-col gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5 lift-hover";

	return href ? (
		<Link href={href} className={className}>
			{body}
		</Link>
	) : (
		<div className={className}>{body}</div>
	);
}
