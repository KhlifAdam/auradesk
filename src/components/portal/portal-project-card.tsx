import { CalendarDays, Images, MapPin } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { StageBadge } from "@/components/client-work/stage-badge";
import { ChangePill, changeHighlight } from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import type { PortalProject } from "@/services/portal/types";
import { PROJECT_STAGES, stageIndex } from "@/services/projects/stages";

export async function PortalProjectCard({
	project,
}: {
	project: PortalProject;
}) {
	const t = await getTranslations("Portal.projects");
	const tUpdates = await getTranslations("Portal.updates.short");
	const format = await getFormatter();
	const progress =
		((stageIndex(project.stage) + 1) / PROJECT_STAGES.length) * 100;

	return (
		<Link
			href={`/portal/projects/${project.id}`}
			className={cn(
				"group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-luminous-lg active:translate-y-0",
				changeHighlight(project.mark),
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<p className="flex items-center gap-2 font-medium leading-snug group-hover:text-primary">
					{project.title}
					{project.update ? (
						// Says what changed rather than just "Updated".
						<span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
							{tUpdates(project.update)}
						</span>
					) : (
						<ChangePill mark={project.mark} />
					)}
				</p>
				<StageBadge stage={project.stage} />
			</div>
			<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
				{project.eventDate && (
					<span className="flex items-center gap-1">
						<CalendarDays className="h-3 w-3" />
						{format.dateTime(new Date(project.eventDate), {
							dateStyle: "medium",
							timeZone: "UTC",
						})}
					</span>
				)}
				{project.location && (
					<span className="flex items-center gap-1">
						<MapPin className="h-3 w-3" />
						{project.location}
					</span>
				)}
				<span className="flex items-center gap-1">
					<Images className="h-3 w-3" />
					{t("galleries", { count: project.sharedGalleryCount })}
				</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 shadow-[0_0_10px_var(--primary)] transition-all duration-500"
					style={{ width: `${progress}%` }}
				/>
			</div>
		</Link>
	);
}
