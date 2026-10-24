"use client";

import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ToolOutput } from "./chat-ask";
import {
	CardFrame,
	EmptyLine,
	NotFound,
	Pill,
	Rows,
	useAssistantFormat,
} from "./primitives";

/** A collaborator's assigned projects. */
export function AssignedProjectsCard({
	data,
}: {
	data: ToolOutput<"my_projects">;
}) {
	const t = useTranslations("Assistant.cards");
	const tStage = useTranslations("Projects.stages");
	const f = useAssistantFormat();
	return (
		<CardFrame
			icon={FolderKanban}
			title={t("myProjects")}
			count={data.total}
			href="/team"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noProjects")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((p) => (
						<li key={p.id}>
							<Link
								href={`/team/projects/${p.id}`}
								className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{p.title}</p>
									<p className="truncate text-xs text-muted-foreground">
										{[p.studioName, p.role, f.day(p.eventDate), p.location]
											.filter(Boolean)
											.join(" · ")}
									</p>
								</div>
								<Pill tone="primary">{tStage(p.stage)}</Pill>
							</Link>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function AssignedProjectCard({
	data,
}: {
	data: ToolOutput<"get_assigned_project">;
}) {
	const t = useTranslations("Assistant.cards");
	const f = useAssistantFormat();
	if (!data.found) return <NotFound />;
	const { project } = data;
	const facts = [
		[
			t("when"),
			[
				f.day(project.eventDate),
				project.startTime && `${project.startTime}–${project.endTime}`,
			]
				.filter(Boolean)
				.join(" · "),
		],
		[t("where"), project.location],
		[
			t("contact"),
			[project.contactName, project.contactPhone].filter(Boolean).join(" · "),
		],
		[
			t("crew"),
			project.team
				.map((m) => `${m.name}${m.role ? ` (${m.role})` : ""}`)
				.join(", "),
		],
		[t("gear"), project.gear.map((g) => g.name).join(", ")],
	].filter(([, value]) => value);

	return (
		<CardFrame
			icon={FolderKanban}
			title={project.title}
			href={`/team/projects/${project.id}`}
		>
			<dl className="flex flex-col gap-0.5 px-3 py-2 text-xs">
				{facts.map(([label, value]) => (
					<div key={label} className="flex gap-2">
						<dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
						<dd className="min-w-0 break-words">{value}</dd>
					</div>
				))}
			</dl>
		</CardFrame>
	);
}
