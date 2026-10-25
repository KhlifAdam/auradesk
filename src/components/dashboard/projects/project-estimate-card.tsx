import { CalendarClock, Hourglass, Sparkles } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { DeadlineStatus, Estimate } from "@/lib/projects/estimate";
import { cn } from "@/lib/utils";

const DEADLINE_TONE: Record<DeadlineStatus, string> = {
	onTrack: "bg-success/15 text-success",
	tight: "bg-warning/15 text-warning",
	late: "bg-destructive/15 text-destructive",
};

/** When the project should be finished, and what the time goes into. */
export async function ProjectEstimateCard({
	estimate,
}: {
	estimate: Estimate;
}) {
	const t = await getTranslations("Estimate");
	const format = await getFormatter();
	if (estimate.done) return null;
	const max = Math.max(...estimate.tasks.map((task) => task.hours), 1);
	const finish = format.dateTime(new Date(`${estimate.finishDate}T12:00:00Z`), {
		weekday: "short",
		day: "numeric",
		month: "short",
	});

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
					<Sparkles className="h-3.5 w-3.5 text-primary" />
					{t("title")}
				</h2>
				<span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
					{t(`confidence.${estimate.confidence}`)}
				</span>
			</div>

			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col">
					<span className="flex items-center gap-1.5 font-display text-lg font-semibold">
						<CalendarClock className="h-4 w-4 text-primary" />
						{t("finish", { date: finish })}
					</span>
					<span className="text-xs text-muted-foreground">
						{t("summary", {
							days: estimate.daysLeft,
							hours: estimate.hoursLeft,
						})}
					</span>
				</div>
				{estimate.deadline && (
					<span
						className={cn(
							"rounded-full px-2 py-0.5 text-[11px] font-medium",
							DEADLINE_TONE[estimate.deadline.status],
						)}
					>
						{t(`deadline.${estimate.deadline.status}`, {
							days: Math.abs(estimate.deadline.slackDays),
						})}
					</span>
				)}
			</div>

			{estimate.tasks.length > 0 && (
				<ul className="flex flex-col gap-1.5">
					{estimate.tasks.map((task) => (
						<li
							key={task.key}
							className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-2 text-[11px]"
						>
							<span className="truncate text-muted-foreground">
								{t(`tasks.${task.key}`)}
							</span>
							<span className="h-1.5 overflow-hidden rounded-full bg-muted">
								<span
									className="block h-full rounded-full bg-primary/70"
									style={{ width: `${(task.hours / max) * 100}%` }}
								/>
							</span>
							<span className="text-right tabular-nums">
								{t("hours", { hours: task.hours })}
							</span>
						</li>
					))}
				</ul>
			)}

			{estimate.waits.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{estimate.waits.map((wait) => (
						<span
							key={wait.key}
							className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground"
						>
							<Hourglass className="h-3 w-3" />
							{t(`waits.${wait.key}`, { days: wait.days })}
						</span>
					))}
				</div>
			)}

			<p className="text-[11px] text-muted-foreground">
				{estimate.assumed.photos > 0 &&
					t(estimate.assumed.fromFiles ? "basis.files" : "basis.typical", {
						photos: estimate.assumed.photos,
					})}
				{estimate.assumed.videoMinutes > 0 &&
					` ${t("basis.video", { minutes: estimate.assumed.videoMinutes })}`}
				{estimate.basis === "blended" && ` ${t("basis.history")}`}
			</p>
		</section>
	);
}
