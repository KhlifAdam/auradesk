"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Years listed around the current one, back and forward. */
const YEAR_SPAN = 15;
const MONTHS = Array.from({ length: 12 }, (_, i) =>
	String(i + 1).padStart(2, "0"),
);

interface MonthPickerProps {
	month: string;
	today: string;
	href: (month: string) => string;
}

/** The month title; opens a scrollable year list and a grid of months. */
export function MonthPicker({ month, today, href }: MonthPickerProps) {
	const t = useTranslations("Calendar.toolbar");
	const format = useFormatter();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [year, setYear] = useState(month.slice(0, 4));

	const thisYear = Number(today.slice(0, 4));
	const years = Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, i) =>
		String(thisYear - YEAR_SPAN + i),
	);
	const label = (key: string, long: boolean) =>
		format.dateTime(
			new Date(`${key}-15T12:00:00.000Z`),
			long
				? { month: "long", year: "numeric", timeZone: "UTC" }
				: { month: "short", timeZone: "UTC" },
		);

	const pick = (next: string) => {
		setOpen(false);
		router.push(href(next));
	};

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) setYear(month.slice(0, 4));
			}}
		>
			<PopoverTrigger
				aria-label={t("pickMonth")}
				className="ml-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 font-display text-base font-semibold capitalize transition-colors duration-200 hover:bg-muted"
			>
				{label(month, true)}
				<ChevronDown className="h-4 w-4 text-muted-foreground" />
			</PopoverTrigger>
			<PopoverContent align="start" className="flex w-72 gap-2 p-2">
				<ul className="scrollbar-thin relative flex max-h-52 w-16 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border pr-1">
					{years.map((y) => (
						<li key={y}>
							<button
								type="button"
								// Brings the shown year into view when the list opens.
								ref={(node) => {
									const list = node?.closest("ul");
									if (node && list && y === year)
										list.scrollTop = node.offsetTop - list.clientHeight / 2;
								}}
								onClick={() => setYear(y)}
								className={cn(
									"w-full rounded-md px-2 py-1 text-left text-xs transition-colors duration-200 hover:bg-muted",
									y === year &&
										"bg-primary text-primary-foreground hover:bg-primary",
									y !== year &&
										Number(y) === thisYear &&
										"font-semibold text-primary",
								)}
							>
								{y}
							</button>
						</li>
					))}
				</ul>
				<div className="grid flex-1 grid-cols-3 content-start gap-1">
					{MONTHS.map((m) => {
						const key = `${year}-${m}`;
						return (
							<button
								key={key}
								type="button"
								onClick={() => pick(key)}
								className={cn(
									"rounded-md px-1 py-2 text-xs capitalize transition-colors duration-200 hover:bg-muted",
									key === month &&
										"bg-primary text-primary-foreground hover:bg-primary",
									key !== month &&
										key === today.slice(0, 7) &&
										"font-semibold text-primary",
								)}
							>
								{label(key, false)}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
