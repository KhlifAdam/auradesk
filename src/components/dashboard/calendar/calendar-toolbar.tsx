"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { shiftMonth } from "@/services/calendar/dates";
import { ColorGuide } from "./color-guide";
import { MonthPicker } from "./month-picker";

const monthHref = (month: string) => `/dashboard/calendar?month=${month}`;

interface CalendarToolbarProps {
	month: string;
	today: string;
	onToday: () => void;
	onCreate: () => void;
}

export function CalendarToolbar({
	month,
	today,
	onToday,
	onCreate,
}: CalendarToolbarProps) {
	const t = useTranslations("Calendar");
	const thisMonth = today.slice(0, 7);

	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<div className="flex items-center gap-1.5">
				<Button asChild variant="outline" size="icon" className="h-8 w-8">
					<Link
						href={monthHref(shiftMonth(month, -1))}
						aria-label={t("toolbar.previous")}
					>
						<ChevronLeft className="h-4 w-4" />
					</Link>
				</Button>
				<Button asChild variant="outline" size="icon" className="h-8 w-8">
					<Link
						href={monthHref(shiftMonth(month, 1))}
						aria-label={t("toolbar.next")}
					>
						<ChevronRight className="h-4 w-4" />
					</Link>
				</Button>
				{month === thisMonth ? (
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						onClick={onToday}
					>
						{t("toolbar.today")}
					</Button>
				) : (
					<Button asChild variant="outline" size="sm" className="h-8 text-xs">
						<Link href={monthHref(thisMonth)}>{t("toolbar.today")}</Link>
					</Button>
				)}
				<MonthPicker month={month} today={today} href={monthHref} />
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<ColorGuide />
				<Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onCreate}>
					<Plus className="h-3.5 w-3.5" />
					{t("toolbar.newEvent")}
				</Button>
			</div>
		</div>
	);
}
