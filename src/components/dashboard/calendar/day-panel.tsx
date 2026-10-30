"use client";

import { ArrowUpRight, CalendarCheck, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CalendarEntry } from "@/services/calendar/types";
import { EVENT_STYLES } from "./event-styles";
import { dayAvailability, useEntryLabels } from "./use-calendar-entries";
import { findDayMarker, useDayAvailability } from "./use-day-availability";

interface DayPanelProps {
	day: string;
	timeZone: string;
	entries: CalendarEntry[];
	onCreate: (day: string) => void;
	onOpen: (entry: CalendarEntry) => void;
}

export function DayPanel({
	day,
	timeZone,
	entries,
	onCreate,
	onOpen,
}: DayPanelProps) {
	const t = useTranslations("Calendar.day");
	const format = useFormatter();
	const labels = useEntryLabels(timeZone);
	const { isPending, setAvailability } = useDayAvailability(timeZone);

	const marker = findDayMarker(day, entries);
	// The day-off switch already stands for the day's marker.
	const items = entries.filter((entry) => entry !== marker);
	const dayOff = dayAvailability(entries) === "UNAVAILABLE";

	return (
		<aside className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:sticky lg:top-5 lg:self-start">
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<h2 className="font-display text-sm font-semibold capitalize">
						{format.dateTime(new Date(`${day}T12:00:00.000Z`), {
							weekday: "long",
							day: "numeric",
							month: "long",
							timeZone: "UTC",
						})}
					</h2>
					<p className="text-xs text-muted-foreground">
						{dayOff
							? t("status.dayOff")
							: items.length > 0
								? t("status.planned", { count: items.length })
								: t("status.free")}
					</p>
				</div>
				<Button
					size="sm"
					variant="outline"
					className="h-7 gap-1 px-2 text-xs"
					onClick={() => onCreate(day)}
				>
					<Plus className="h-3.5 w-3.5" />
					{t("add")}
				</Button>
			</div>

			{/* Days are open by default; one switch blocks the whole day. */}
			<label
				htmlFor="day-off"
				className={cn(
					"flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-2.5 transition-opacity duration-200",
					isPending && "opacity-60",
				)}
			>
				<span className="flex flex-col gap-0.5">
					<span className="text-xs font-medium">{t("dayOff")}</span>
					<span className="text-[11px] text-muted-foreground">
						{t("dayOffHint")}
					</span>
				</span>
				<Switch
					id="day-off"
					checked={marker?.type === "UNAVAILABLE"}
					disabled={isPending}
					onCheckedChange={(checked) =>
						setAvailability(day, entries, checked ? "UNAVAILABLE" : null)
					}
				/>
			</label>

			{items.length === 0 ? (
				<div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-6 text-center">
					<CalendarCheck className="h-5 w-5 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">{t("empty")}</p>
				</div>
			) : (
				<ul className="flex flex-col gap-1.5">
					{items.map((entry) => {
						const style = EVENT_STYLES[entry.type];
						const Icon = style.icon;
						return (
							<li key={entry.id} className="group relative">
								<button
									type="button"
									onClick={() => onOpen(entry)}
									className="flex w-full items-stretch gap-2.5 rounded-lg border border-border p-2 text-left transition-colors duration-200 hover:bg-muted/50"
								>
									<span
										className={cn("w-1 shrink-0 rounded-full", style.bar)}
									/>
									<span className="flex min-w-0 flex-1 flex-col gap-0.5">
										<span className="flex items-center gap-1.5 text-xs font-medium">
											<Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<span className="truncate">{labels.title(entry)}</span>
										</span>
										<span className="text-[11px] text-muted-foreground">
											{labels.range(entry, day)}
											{entry.kind === "project" && ` · ${t("schedule")}`}
										</span>
										{entry.location && (
											<span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
												<MapPin className="h-3 w-3 shrink-0" />
												{entry.location}
											</span>
										)}
									</span>
								</button>
								{entry.projectId && (
									<Link
										href={`/dashboard/projects/${entry.projectId}`}
										aria-label={t("openProject")}
										title={entry.projectTitle ?? t("openProject")}
										className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
									>
										<ArrowUpRight className="h-3.5 w-3.5" />
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</aside>
	);
}
