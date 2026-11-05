import { CalendarDays, Images } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { StageBadge } from "@/components/client-work/stage-badge";
import {
	ChangePill,
	changeRowHighlight,
} from "@/components/shared/change-mark";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/services/projects/types";
import { InviteStatusBadge } from "./invite-status-badge";
import { PaymentBadge } from "./payment-badge";

/** Project rows; `hideClient` when the list is already one client's. */
export async function ProjectTable({
	projects,
	hideClient,
}: {
	projects: ProjectSummary[];
	hideClient?: boolean;
}) {
	const t = await getTranslations("Projects.list");
	const format = await getFormatter();

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
			{projects.map((project) => (
				<li key={project.id}>
					<Link
						href={`/dashboard/projects/${project.id}`}
						className={cn(
							"flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 transition-colors hover:bg-muted/50",
							changeRowHighlight(project.mark),
						)}
					>
						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-2 text-sm font-medium">
								<span className="truncate">{project.title}</span>
								<ChangePill mark={project.mark} />
							</p>
							{!hideClient && (
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span className="truncate">
										{project.client.name ??
											project.client.email ??
											t("noClient")}
									</span>
									<InviteStatusBadge status={project.client.status} />
								</div>
							)}
						</div>
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							{project.eventDate && (
								<span className="flex items-center gap-1">
									<CalendarDays className="h-3 w-3" />
									{format.dateTime(new Date(project.eventDate), {
										dateStyle: "medium",
										timeZone: "UTC",
									})}
								</span>
							)}
							<span className="flex items-center gap-1">
								<Images className="h-3 w-3" />
								{t("galleries", { count: project.galleryCount })}
							</span>
							<PaymentBadge status={project.paymentStatus} />
							<StageBadge stage={project.stage} />
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
