"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { monthGridDays } from "@/services/calendar/dates";
import { entryToValues, newEventValues } from "@/services/calendar/form-values";
import type { CalendarEntry, ProjectOption } from "@/services/calendar/types";
import { CalendarToolbar } from "./calendar-toolbar";
import { DayPanel } from "./day-panel";
import { type EventDraft, EventFormDialog } from "./event-form-dialog";
import { MonthGrid } from "./month-grid";
import { useEntriesByDay } from "./use-calendar-entries";

interface CalendarViewProps {
	month: string;
	today: string;
	timeZone: string;
	weekStartsOn: number;
	entries: CalendarEntry[];
	projects: ProjectOption[];
}

/** Month grid + selected-day panel; owns selection and the event dialog. */
export function CalendarView({
	month,
	today,
	timeZone,
	weekStartsOn,
	entries,
	projects,
}: CalendarViewProps) {
	const router = useRouter();
	const days = monthGridDays(month, weekStartsOn);
	const byDay = useEntriesByDay(entries, timeZone);
	const [selected, setSelected] = useState(
		today.startsWith(month) ? today : `${month}-01`,
	);
	const [draft, setDraft] = useState<EventDraft | null>(null);

	const create = (day: string) => {
		setSelected(day);
		setDraft({ values: newEventValues(day) });
	};
	// A project date opens a new event already linked to that project.
	// An expected delivery opens its project.
	const open = (entry: CalendarEntry) =>
		entry.kind === "estimate" && entry.projectId
			? router.push(`/dashboard/projects/${entry.projectId}`)
			: setDraft({
					id: entry.kind === "event" ? entry.id : undefined,
					values: entryToValues(entry, timeZone),
				});

	return (
		<div className="flex flex-col gap-3">
			<CalendarToolbar
				month={month}
				today={today}
				onToday={() => setSelected(today)}
				onCreate={() => create(selected)}
			/>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
				<MonthGrid
					month={month}
					days={days}
					today={today}
					selected={selected}
					timeZone={timeZone}
					byDay={byDay}
					onSelect={setSelected}
					onCreate={create}
					onOpen={open}
				/>
				<DayPanel
					day={selected}
					timeZone={timeZone}
					entries={byDay.get(selected) ?? []}
					onCreate={create}
					onOpen={open}
				/>
			</div>
			<EventFormDialog
				draft={draft}
				onClose={() => setDraft(null)}
				timeZone={timeZone}
				projects={projects}
			/>
		</div>
	);
}
