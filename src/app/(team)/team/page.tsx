import { CalendarDays, ChevronRight, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { StageBadge } from "@/components/client-work/stage-badge";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { VerifyEmailCard } from "@/components/portal/verify-email-card";
import { TeamInvitationCard } from "@/components/team/team-invitation-card";
import { requireTeamUser } from "@/lib/auth/require-team-user";
import { realEmail } from "@/lib/phone";
import { pageParamsSchema } from "@/services/shared/pagination";
import {
	countPendingTeamInvitations,
	listAssignedProjects,
	listTeamInvitations,
} from "@/services/team/space-queries";

interface TeamHomeProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** A collaborator's home: invitations to answer and the projects they're on. */
export default async function TeamHome({ searchParams }: TeamHomeProps) {
	const t = await getTranslations("TeamSpace.home");
	const format = await getFormatter();
	const { page } = pageParamsSchema.parse(await searchParams);
	const { session, userId } = await requireTeamUser();
	const email = realEmail(session.user.email);
	const verified = Boolean(email && session.user.emailVerified);

	const [invitations, unverifiedCount, projects] = await Promise.all([
		verified && email ? listTeamInvitations(email) : [],
		!verified && email ? countPendingTeamInvitations(email) : 0,
		listAssignedProjects(userId, page),
	]);

	return (
		<>
			<div className="flex flex-col gap-0.5">
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{t("title", { name: session.user.name })}
				</h1>
				<p className="text-xs text-muted-foreground">{t("description")}</p>
			</div>
			{email && unverifiedCount > 0 && (
				<VerifyEmailCard email={email} count={unverifiedCount} />
			)}
			{invitations.length > 0 && (
				<section className="flex flex-col gap-3">
					{invitations.map((invitation) => (
						<TeamInvitationCard key={invitation.id} invitation={invitation} />
					))}
				</section>
			)}
			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">{t("projects")}</h2>
				{projects.items.length === 0 ? (
					<EmptyState
						icon={UsersRound}
						title={t("noProjects")}
						description={t("noProjectsHint")}
					/>
				) : (
					<>
						<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
							{projects.items.map((project) => (
								<li key={project.id}>
									<Link
										href={`/team/projects/${project.id}`}
										className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{project.title}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{project.studioName}
												{project.role && ` · ${project.role}`}
											</p>
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
											{project.location && (
												<span className="hidden items-center gap-1 md:flex">
													<MapPin className="h-3 w-3" />
													<span className="max-w-40 truncate">
														{project.location}
													</span>
												</span>
											)}
											<StageBadge stage={project.stage} />
											<ChevronRight className="h-3.5 w-3.5" />
										</div>
									</Link>
								</li>
							))}
						</ul>
						<UrlPagination
							page={projects.page}
							pageCount={projects.pageCount}
						/>
					</>
				)}
			</section>
		</>
	);
}
