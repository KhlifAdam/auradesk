import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CalendarSkeleton } from "@/components/dashboard/calendar/calendar-skeleton";
import { CalendarView } from "@/components/dashboard/calendar/calendar-view";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { todayKey } from "@/services/calendar/dates";
import {
	listCalendarEntries,
	listEstimateEntries,
	listProjectOptions,
} from "@/services/calendar/queries";
import { calendarParamsSchema } from "@/services/calendar/schemas";

interface CalendarPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CalendarPage({
	searchParams,
}: CalendarPageProps) {
	const t = await getTranslations("Calendar");
	const params = calendarParamsSchema.parse(await searchParams);
	const timeZone = await getRequestTimeZone();
	const today = todayKey(timeZone);
	const month = params.month ?? today.slice(0, 7);

	return (
		<PageShell>
			<PageHeader title={t("title")} description={t("description")} />
			<Suspense key={month} fallback={<CalendarSkeleton />}>
				<CalendarData month={month} today={today} timeZone={timeZone} />
			</Suspense>
		</PageShell>
	);
}

async function CalendarData({
	month,
	today,
	timeZone,
}: {
	month: string;
	today: string;
	timeZone: string;
}) {
	const { photographerId } = await requirePhotographer();
	const [entries, estimates, projects, locale] = await Promise.all([
		listCalendarEntries(photographerId, month),
		listEstimateEntries(photographerId, month),
		listProjectOptions(photographerId),
		getLocale(),
	]);

	return (
		<CalendarView
			key={month}
			month={month}
			today={today}
			timeZone={timeZone}
			// Weeks start on Monday in French, Sunday in English.
			weekStartsOn={locale === "fr" ? 1 : 0}
			entries={[...entries, ...estimates]}
			projects={projects}
		/>
	);
}
