"use client";

import { CalendarClock, ChevronRight, Hourglass, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ToolOutput } from "./chat-ask";
import {
	CardFrame,
	EmptyLine,
	NotFound,
	Pill,
	type PillTone,
	Rows,
	useAssistantFormat,
} from "./primitives";

const REASON_TONE: Record<string, PillTone> = {
	overdue: "danger",
	deliveredUnpaid: "warning",
	readyUnpaid: "warning",
	deliveringSoon: "primary",
	dueSoon: "primary",
	open: "neutral",
};

const DEADLINE_TONE: Record<string, PillTone> = {
	onTrack: "success",
	tight: "warning",
	late: "danger",
};

export function MoneyToCollectCard({
	data,
}: {
	data: ToolOutput<"money_to_collect">;
}) {
	const t = useTranslations("Money");
	const fmt = useAssistantFormat();
	return (
		<CardFrame icon={Wallet} title={t("title")} href="/dashboard/invoices">
			<div className="grid grid-cols-3 gap-px bg-border/60 text-center">
				{[
					[t("toCollect"), fmt.money(data.toCollect)],
					[
						t("overdue", { count: data.overdue.count }),
						fmt.money(data.overdue.amount),
					],
					[t("collectedThisMonth"), fmt.money(data.collectedThisMonth)],
				].map(([label, value]) => (
					<div key={label} className="flex flex-col bg-card px-2 py-1.5">
						<span className="truncate text-[10px] text-muted-foreground">
							{label}
						</span>
						<span className="text-sm font-semibold tabular-nums">{value}</span>
					</div>
				))}
			</div>
			{data.items.length === 0 ? (
				<EmptyLine>{t("allPaid")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((item) => (
						<li key={`${item.kind}-${item.id}`}>
							<Link
								href={item.href}
								className="group flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50"
							>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium">{item.label}</span>
									<span className="truncate text-[11px] text-muted-foreground">
										{item.clientName}
									</span>
								</span>
								<Pill tone={REASON_TONE[item.reason]}>
									{t(`reasons.${item.reason}`, { days: item.days ?? 0 })}
								</Pill>
								<span className="font-semibold tabular-nums">
									{fmt.money(item.amount)}
								</span>
								<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
							</Link>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function EstimateCard({
	data,
}: {
	data: ToolOutput<"estimate_project">;
}) {
	const t = useTranslations("Estimate");
	const fmt = useAssistantFormat();
	if (!data.found) return <NotFound />;
	const { estimate } = data;
	return (
		<CardFrame
			icon={CalendarClock}
			title={data.title}
			href={`/dashboard/projects/${data.projectId}`}
		>
			{estimate.done ? (
				<EmptyLine>{t("done")}</EmptyLine>
			) : (
				<div className="flex flex-col gap-2 px-3 py-2.5 text-xs">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<span className="text-sm font-semibold">
							{t("finish", { date: fmt.day(estimate.finishDate) })}
						</span>
						{estimate.deadline && (
							<Pill tone={DEADLINE_TONE[estimate.deadline.status]}>
								{t(`deadline.${estimate.deadline.status}`, {
									days: Math.abs(estimate.deadline.slackDays),
								})}
							</Pill>
						)}
					</div>
					<span className="text-muted-foreground">
						{t("summary", {
							days: estimate.daysLeft,
							hours: estimate.hoursLeft,
						})}
					</span>
					<div className="flex flex-wrap gap-1">
						{estimate.tasks.map((task) => (
							<Pill key={task.key}>
								{t(`tasks.${task.key}`)} · {t("hours", { hours: task.hours })}
							</Pill>
						))}
						{estimate.waits.map((wait) => (
							<Pill key={wait.key} tone="primary">
								{t(`waits.${wait.key}`, { days: wait.days })}
							</Pill>
						))}
					</div>
				</div>
			)}
		</CardFrame>
	);
}

export function ForecastCard({
	data,
}: {
	data: ToolOutput<"workload_forecast">;
}) {
	const t = useTranslations("Estimate");
	const fmt = useAssistantFormat();
	return (
		<CardFrame
			icon={Hourglass}
			title={t("forecast", { hours: data.hoursAhead })}
			count={data.total}
			href="/dashboard/calendar"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("nothingAhead")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((item) => (
						<li key={item.projectId}>
							<Link
								href={`/dashboard/projects/${item.projectId}`}
								className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50"
							>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium">{item.title}</span>
									<span className="truncate text-[11px] text-muted-foreground">
										{item.clientName} · {t("hours", { hours: item.hoursLeft })}
									</span>
								</span>
								{item.deadline && item.deadline.status !== "onTrack" && (
									<Pill tone={DEADLINE_TONE[item.deadline.status]}>
										{t(`deadline.${item.deadline.status}`, {
											days: Math.abs(item.deadline.slackDays),
										})}
									</Pill>
								)}
								<span className="shrink-0 tabular-nums">
									{fmt.day(item.finishDate)}
								</span>
							</Link>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}
