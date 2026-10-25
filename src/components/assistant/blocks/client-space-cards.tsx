"use client";

import { ChevronRight, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ToolOutput } from "./chat-ask";
import {
	CardFrame,
	EmptyLine,
	Pill,
	type PillTone,
	Rows,
	useAssistantFormat,
} from "./primitives";

/** One linked line in a client card. */
export function Row({
	href,
	title,
	subtitle,
	children,
}: {
	href: string;
	title: string;
	subtitle?: string;
	children?: React.ReactNode;
}) {
	return (
		<li>
			<Link
				href={href}
				className="group flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50"
			>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate font-medium">{title}</span>
					{subtitle && (
						<span className="truncate text-[11px] text-muted-foreground">
							{subtitle}
						</span>
					)}
				</span>
				{children}
				<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
			</Link>
		</li>
	);
}

export function ClientProjectsCard({
	data,
}: {
	data: ToolOutput<"client_projects">;
}) {
	const t = useTranslations("Assistant.client");
	const tStages = useTranslations("Projects.stages");
	const fmt = useAssistantFormat();
	return (
		<CardFrame
			icon={FolderKanban}
			title={t("projects")}
			count={data.items.length}
			href="/portal/projects"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noProjects")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((p) => (
						<Row
							key={p.id}
							href={`/portal/projects/${p.id}`}
							title={p.title}
							subtitle={[p.studio, fmt.day(p.eventDate)]
								.filter(Boolean)
								.join(" · ")}
						>
							<Pill tone={p.stage === "DELIVERY" ? "success" : "primary"}>
								{tStages(p.stage)}
							</Pill>
						</Row>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

const NEXT_TONE: Record<string, PillTone> = {
	chooseFiles: "warning",
	payBalance: "warning",
	downloadFiles: "success",
	waitShoot: "neutral",
	waitStudio: "neutral",
};

export function ClientProjectStatusCard({
	data,
}: {
	data: ToolOutput<"client_project_status">;
}) {
	const t = useTranslations("Assistant.client");
	const tStages = useTranslations("Projects.stages");
	const fmt = useAssistantFormat();
	if (!data.found) return <EmptyLine>{t("notFound")}</EmptyLine>;
	const p = data.project;
	return (
		<CardFrame
			icon={FolderKanban}
			title={p.title}
			href={`/portal/projects/${p.id}`}
		>
			<div className="flex flex-col gap-2 px-3 py-2.5 text-xs">
				<div className="flex flex-wrap items-center gap-1.5">
					<Pill tone={p.delivered ? "success" : "primary"}>
						{tStages(p.stage)}
					</Pill>
					<Pill tone={NEXT_TONE[p.nextStep]}>{t(`next.${p.nextStep}`)}</Pill>
				</div>
				<p className="text-muted-foreground">{p.studio}</p>
				{p.expectedReady && !p.delivered && (
					<p>{t("expected", { date: fmt.day(p.expectedReady) })}</p>
				)}
				{p.owedOnInvoices > 0 && (
					<p className="font-medium text-warning">
						{t("owed", { amount: fmt.money(p.owedOnInvoices) })}
					</p>
				)}
				{p.galleries.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{p.galleries.map((g) => (
							<Pill key={g.id}>
								{g.title} ·{" "}
								{g.kind === "PROOFS"
									? t("chosen", { selected: g.selected, files: g.files })
									: t("files", { files: g.files })}
							</Pill>
						))}
					</div>
				)}
			</div>
		</CardFrame>
	);
}
