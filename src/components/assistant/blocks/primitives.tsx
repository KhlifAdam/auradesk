"use client";

import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/services/projects/money";

/** The frame every result card shares: icon, title, count, link to the page. */
export function CardFrame({
	icon: Icon,
	title,
	count,
	href,
	children,
}: {
	icon: LucideIcon;
	title: string;
	count?: number;
	href?: string;
	children: ReactNode;
}) {
	const t = useTranslations("Assistant.cards");
	return (
		<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
			<header className="flex items-center gap-2 border-b border-border/70 bg-muted/30 px-3 py-1.5">
				<Icon className="h-3.5 w-3.5 text-primary" />
				<h3 className="min-w-0 flex-1 truncate text-xs font-semibold">
					{title}
				</h3>
				{count !== undefined && (
					<span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
						{count}
					</span>
				)}
				{href && (
					<Link
						href={href}
						className="flex items-center gap-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
					>
						{t("open")}
						<ArrowUpRight className="h-3 w-3" />
					</Link>
				)}
			</header>
			{children}
		</section>
	);
}

export type PillTone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONES: Record<PillTone, string> = {
	neutral: "bg-muted text-muted-foreground",
	primary: "bg-primary/15 text-primary",
	success: "bg-success/15 text-success",
	warning: "bg-warning/15 text-warning",
	danger: "bg-destructive/15 text-destructive",
};

export function Pill({
	tone = "neutral",
	children,
}: {
	tone?: PillTone;
	children: ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-medium",
				TONES[tone],
			)}
		>
			{children}
		</span>
	);
}

export function EmptyLine({ children }: { children: ReactNode }) {
	return (
		<p className="px-3 py-2.5 text-xs text-muted-foreground">{children}</p>
	);
}

/** A stack of rows separated by hairlines, inside a card. */
export function Rows({ children }: { children: ReactNode }) {
	return (
		<ul className="flex flex-col divide-y divide-border/60">{children}</ul>
	);
}

/** Dates and money the way the rest of the dashboard writes them. */
export function useAssistantFormat() {
	const format = useFormatter();
	const locale = useLocale();
	return {
		day: (iso: string | null) =>
			iso
				? format.dateTime(new Date(iso), {
						dateStyle: "medium",
						timeZone: "UTC",
					})
				: "",
		when: (iso: string) =>
			format.dateTime(new Date(iso), {
				weekday: "short",
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
			}),
		relative: (iso: string) => format.relativeTime(new Date(iso), new Date()),
		money: (value: number | null) =>
			value === null ? "" : formatMoney(value, locale),
	};
}

export function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<p className="flex items-center gap-1.5 border-t border-border/70 bg-muted/20 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
			<Icon className="h-3 w-3" />
			{children}
		</p>
	);
}

/** A lookup that found nothing (deleted, or not this user's). */
export function NotFound() {
	const t = useTranslations("Assistant.cards");
	return (
		<p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
			{t("notFound")}
		</p>
	);
}
