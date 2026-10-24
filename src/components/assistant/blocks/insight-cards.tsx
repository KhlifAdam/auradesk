"use client";

import {
	AlertTriangle,
	BarChart3,
	CalendarDays,
	CheckCircle2,
	ChevronRight,
	ListTodo,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ToolOutput } from "./chat-ask";
import {
	CardFrame,
	EmptyLine,
	Pill,
	Rows,
	useAssistantFormat,
} from "./primitives";

export function TodoCard({ data }: { data: ToolOutput<"todo"> }) {
	const t = useTranslations("Assistant.cards");
	return (
		<CardFrame icon={ListTodo} title={t("todo")} count={data.items.length}>
			{data.items.length === 0 ? (
				<p className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-muted-foreground">
					<CheckCircle2 className="h-3.5 w-3.5 text-success" />
					{t("allClear")}
				</p>
			) : (
				<Rows>
					{data.items.map((item) => (
						<li key={`${item.href}-${item.text}`}>
							<Link
								href={item.href}
								className="group flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50"
							>
								<AlertTriangle
									className={cn(
										"h-3.5 w-3.5 shrink-0",
										item.urgent ? "text-destructive" : "text-primary",
									)}
								/>
								<span className="min-w-0 flex-1">{item.text}</span>
								<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
							</Link>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function AgendaCard({ data }: { data: ToolOutput<"agenda"> }) {
	const t = useTranslations("Assistant.cards");
	const tType = useTranslations("Calendar.types");
	const f = useAssistantFormat();
	return (
		<CardFrame
			icon={CalendarDays}
			title={t("agenda")}
			count={data.items.length}
			href={`/dashboard/calendar?month=${data.month}`}
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noEvents")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((item) => (
						<li key={item.id} className="flex items-center gap-2 px-3 py-1.5">
							<span className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">
								{item.allDay ? f.day(item.startsAt) : f.when(item.startsAt)}
							</span>
							<span className="min-w-0 flex-1 truncate text-sm">
								{item.title || tType(item.type)}
							</span>
							<Pill tone={item.type === "SHOOT" ? "primary" : "neutral"}>
								{tType(item.type)}
							</Pill>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

function Metric({
	label,
	value,
	previous,
	display,
}: {
	label: string;
	value: number;
	previous: number | null;
	display: string;
}) {
	const delta = previous === null ? null : value - previous;
	return (
		<div className="flex flex-col gap-0.5 px-3 py-2">
			<p className="text-[10px] text-muted-foreground uppercase">{label}</p>
			<p className="text-base font-semibold tabular-nums">{display}</p>
			{delta !== null && delta !== 0 && (
				<p
					className={cn(
						"flex items-center gap-0.5 text-[11px]",
						delta > 0 ? "text-success" : "text-destructive",
					)}
				>
					{delta > 0 ? (
						<TrendingUp className="h-3 w-3" />
					) : (
						<TrendingDown className="h-3 w-3" />
					)}
					{delta > 0 ? "+" : ""}
					{Number.isInteger(delta) ? delta : delta.toFixed(1)}
				</p>
			)}
		</div>
	);
}

export function StatsCard({ data }: { data: ToolOutput<"stats"> }) {
	const t = useTranslations("Assistant.cards");
	const f = useAssistantFormat();
	return (
		<CardFrame
			icon={BarChart3}
			title={t(`periods.${data.period}`)}
			href="/dashboard"
		>
			<div className="grid grid-cols-2 divide-x divide-y divide-border/60">
				<Metric
					label={t("bookingsCreated")}
					display={String(data.bookings.created.value)}
					{...data.bookings.created}
				/>
				<Metric
					label={t("bookingsConfirmed")}
					display={String(data.bookings.confirmed.value)}
					{...data.bookings.confirmed}
				/>
				<Metric
					label={t("newClients")}
					display={String(data.clients.new.value)}
					{...data.clients.new}
				/>
				<Metric
					label={t("projectsDelivered")}
					display={String(data.projects.delivered.value)}
					{...data.projects.delivered}
				/>
				<Metric
					label={t("booked")}
					display={f.money(data.money.booked.value)}
					{...data.money.booked}
				/>
				<Metric
					label={t("outstanding")}
					display={f.money(data.money.outstanding)}
					value={data.money.outstanding}
					previous={null}
				/>
			</div>
		</CardFrame>
	);
}
