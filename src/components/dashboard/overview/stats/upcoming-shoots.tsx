import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ShowMoreList } from "@/components/shared/show-more-list";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import type { OverviewStats } from "@/services/overview/stats";

/** The next shootings on the calendar, nearest first; the first few, the rest on demand. */
export async function UpcomingShoots({
	shoots,
}: {
	shoots: OverviewStats["upcoming"];
}) {
	const t = await getTranslations("Dashboard.Overview.statistics.upcoming");
	const format = await getFormatter();
	const timeZone = await getRequestTimeZone();

	return (
		<section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<Link
					href="/dashboard/calendar"
					className="text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					{t("calendar")}
				</Link>
			</div>
			{shoots.length === 0 ? (
				<p className="py-3 text-center text-xs text-muted-foreground">
					{t("empty")}
				</p>
			) : (
				<ShowMoreList className="flex flex-col divide-y divide-border">
					{shoots.map((shoot) => (
						<li key={shoot.id} className="py-2 first:pt-0 last:pb-0">
							<Link
								href={
									shoot.projectId
										? `/dashboard/projects/${shoot.projectId}`
										: "/dashboard/calendar"
								}
								className="group flex flex-col gap-0.5"
							>
								<span className="truncate text-sm font-medium group-hover:text-primary">
									{shoot.title || t("untitled")}
								</span>
								<span className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
									<span className="flex items-center gap-1">
										<CalendarDays className="h-3 w-3" />
										{format.dateTime(
											new Date(shoot.startsAt),
											shoot.allDay
												? { dateStyle: "medium", timeZone: "UTC" }
												: { dateStyle: "medium", timeStyle: "short", timeZone },
										)}
									</span>
									{shoot.location && (
										<span className="flex items-center gap-1 truncate">
											<MapPin className="h-3 w-3" />
											{shoot.location}
										</span>
									)}
								</span>
							</Link>
						</li>
					))}
				</ShowMoreList>
			)}
		</section>
	);
}
