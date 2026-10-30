"use client";

import { Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CalendarEntry } from "@/services/calendar/types";
import { AVAILABILITY_TINT, EVENT_STYLES } from "./event-styles";
import { dayAvailability, useEntryLabels } from "./use-calendar-entries";

const VISIBLE_CHIPS = 3;

interface MonthGridProps {
	month: string;
	days: string[];
	today: string;
	selected: string;
	timeZone: string;
	byDay: Map<string, CalendarEntry[]>;
	onSelect: (day: string) => void;
	onCreate: (day: string) => void;
	onOpen: (entry: CalendarEntry) => void;
}

const utcNoon = (day: string) => new Date(`${day}T12:00:00.000Z`);

export function MonthGrid({
	month,
	days,
	today,
	selected,
	timeZone,
	byDay,
	onSelect,
	onCreate,
	onOpen,
}: MonthGridProps) {
	const t = useTranslations("Calendar.grid");
	const format = useFormatter();
	const labels = useEntryLabels(timeZone);

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<div className="grid grid-cols-7 border-b border-border bg-muted/40">
				{days.slice(0, 7).map((day) => (
					<div
						key={day}
						className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
					>
						{format.dateTime(utcNoon(day), {
							weekday: "short",
							timeZone: "UTC",
						})}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-px bg-border">
				{days.map((day) => {
					const entries = byDay.get(day) ?? [];
					const availability = dayAvailability(entries);
					const inMonth = day.startsWith(month);
					const hidden = entries.length - VISIBLE_CHIPS;
					const dateLabel = format.dateTime(utcNoon(day), {
						dateStyle: "full",
						timeZone: "UTC",
					});
					return (
						<div
							key={day}
							className="group relative flex min-h-16 flex-col gap-0.5 bg-card p-1 sm:min-h-24"
						>
							<span
								aria-hidden
								className={cn(
									"pointer-events-none absolute inset-0 transition-colors duration-200",
									!inMonth && "bg-muted/40",
									availability && AVAILABILITY_TINT[availability],
									day === selected &&
										cn(
											"ring-1 ring-inset ring-primary/50",
											// A day off stays red when selected.
											availability !== "UNAVAILABLE" && "bg-primary/5",
										),
								)}
							/>
							{/* Full-cell target under the chips selects the day. */}
							<button
								type="button"
								aria-label={dateLabel}
								aria-pressed={day === selected}
								onClick={() => onSelect(day)}
								onDoubleClick={() => onCreate(day)}
								className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
							/>
							<div className="pointer-events-none relative flex items-center justify-between">
								<span
									className={cn(
										"flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium",
										inMonth ? "text-foreground" : "text-muted-foreground/60",
										day === today && "bg-primary text-primary-foreground",
									)}
								>
									{Number(day.slice(8))}
								</span>
								<button
									type="button"
									aria-label={t("addOn", { date: dateLabel })}
									onClick={() => onCreate(day)}
									className="pointer-events-auto hidden h-5 w-5 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity duration-200 hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
								>
									<Plus className="h-3 w-3" />
								</button>
							</div>
							{/* Phones: colored dots only. */}
							<div className="pointer-events-none relative flex flex-wrap gap-0.5 px-0.5 sm:hidden">
								{entries.slice(0, 4).map((entry) => (
									<span
										key={entry.id}
										className={cn(
											"h-1.5 w-1.5 rounded-full",
											EVENT_STYLES[entry.type].dot,
										)}
									/>
								))}
							</div>
							<div className="relative hidden flex-col gap-0.5 sm:flex">
								{entries.slice(0, VISIBLE_CHIPS).map((entry) => {
									const time = labels.startTime(entry, day);
									return (
										<button
											key={entry.id}
											type="button"
											onClick={() => onOpen(entry)}
											className={cn(
												"flex items-center gap-1 truncate rounded px-1 py-px text-left text-[11px] font-medium leading-4 transition-colors duration-200",
												EVENT_STYLES[entry.type].chip,
											)}
										>
											{time && (
												<span className="shrink-0 opacity-75">{time}</span>
											)}
											<span className="truncate">{labels.title(entry)}</span>
										</button>
									);
								})}
								{hidden > 0 && (
									<button
										type="button"
										onClick={() => onSelect(day)}
										className="px-1 text-left text-[11px] text-muted-foreground hover:text-foreground"
									>
										{t("more", { count: hidden })}
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
