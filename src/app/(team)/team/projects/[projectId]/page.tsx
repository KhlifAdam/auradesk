import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { StageTimeline } from "@/components/client-work/stage-timeline";
import { requireTeamUser } from "@/lib/auth/require-team-user";
import { getAssignedProject } from "@/services/team/space-queries";

function Card({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<h2 className="text-sm font-semibold">{title}</h2>
			{children}
		</section>
	);
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
	if (!children) return null;
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="whitespace-pre-wrap break-words text-sm">{children}</dd>
		</div>
	);
}

/** An assigned project as the crew sees it: the plan, the people, the gear. */
export default async function TeamProjectPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const t = await getTranslations("TeamSpace.project");
	const tService = await getTranslations("Projects.serviceTypes");
	const tMedia = await getTranslations("Projects.mediaTypes");
	const tLocation = await getTranslations("Projects.locationTypes");
	const tKind = await getTranslations("Equipment.kinds");
	const format = await getFormatter();
	const { projectId } = await params;
	const { userId } = await requireTeamUser();
	const project = await getAssignedProject(userId, projectId);
	if (!project) notFound();

	const day = (iso: string | null) =>
		iso &&
		format.dateTime(new Date(iso), { dateStyle: "full", timeZone: "UTC" });
	const hours = [project.startTime, project.endTime]
		.filter(Boolean)
		.join(" – ");

	return (
		<>
			<Link
				href="/team"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<div className="flex flex-col gap-0.5">
				<p className="text-xs text-muted-foreground">{project.studioName}</p>
				<h1 className="font-display text-2xl font-bold tracking-tight">
					{project.title}
				</h1>
				{project.role && (
					<p className="text-sm text-primary">
						{t("yourRole", { role: project.role })}
					</p>
				)}
			</div>
			<section className="rounded-xl border border-border bg-card p-3">
				<StageTimeline stage={project.stage} media={project.mediaType} />
			</section>
			<div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
				<Card title={t("plan")}>
					<dl className="grid gap-3 sm:grid-cols-2">
						<Fact label={t("type")}>
							{`${tService(project.serviceType)} · ${tMedia(project.mediaType)}`}
						</Fact>
						<Fact label={t("date")}>{day(project.eventDate)}</Fact>
						<Fact label={t("hours")}>{hours}</Fact>
						<Fact label={t("location")}>
							{[
								project.locationType && tLocation(project.locationType),
								project.location,
							]
								.filter(Boolean)
								.join(" · ")}
						</Fact>
						<Fact label={t("contact")}>
							{[project.contactName, project.contactPhone]
								.filter(Boolean)
								.join(" · ")}
						</Fact>
						<Fact label={t("deadline")}>{day(project.deliveryDeadline)}</Fact>
						<Fact label={t("brief")}>{project.description}</Fact>
					</dl>
				</Card>
				<div className="flex flex-col gap-3">
					<Card title={t("crew")}>
						<ul className="flex flex-col gap-1.5 text-sm">
							{project.team.map((member) => (
								<li key={member.name} className="flex justify-between gap-2">
									<span className="font-medium">{member.name}</span>
									<span className="truncate text-xs text-muted-foreground">
										{member.role || member.specialty}
									</span>
								</li>
							))}
						</ul>
					</Card>
					<Card title={t("gear")}>
						{project.gear.length === 0 ? (
							<p className="text-xs text-muted-foreground">{t("noGear")}</p>
						) : (
							<ul className="flex flex-col gap-1.5 text-sm">
								{project.gear.map((item) => (
									<li
										key={`${item.name}-${item.startDate}`}
										className="flex justify-between gap-2"
									>
										<span>{item.name}</span>
										<span className="text-xs text-muted-foreground">
											{tKind(item.kind)}
										</span>
									</li>
								))}
							</ul>
						)}
					</Card>
				</div>
			</div>
		</>
	);
}
