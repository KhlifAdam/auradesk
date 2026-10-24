"use client";

import { FolderKanban, Images, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AskButton, type ToolOutput } from "./chat-ask";
import { InvoiceRowItem } from "./invoice-cards";
import { MediaStrip } from "./media-strip";
import {
	CardFrame,
	EmptyLine,
	NotFound,
	Pill,
	Rows,
	SectionTitle,
	useAssistantFormat,
} from "./primitives";
import { ProjectRowItem } from "./project-row";

export function ProjectListCard({
	data,
}: {
	data: ToolOutput<"list_projects">;
}) {
	const t = useTranslations("Assistant.cards");
	return (
		<CardFrame
			icon={FolderKanban}
			title={t("projects")}
			count={data.total}
			href="/dashboard/projects"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noResults")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((project) => (
						<ProjectRowItem key={project.id} project={project} />
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function ProjectDetailCard({
	data,
}: {
	data: ToolOutput<"get_project">;
}) {
	const t = useTranslations("Assistant.cards");
	const tStage = useTranslations("Projects.stages");
	const tKind = useTranslations("Assistant.cards.galleryKinds");
	const f = useAssistantFormat();
	const [openGallery, setOpenGallery] = useState<string | null>(null);
	if (!data.found) return <NotFound />;
	const { project } = data;

	return (
		<CardFrame
			icon={FolderKanban}
			title={project.title}
			href={`/dashboard/projects/${project.id}`}
		>
			<div className="flex flex-col gap-2 px-3 py-2.5 text-xs">
				<div className="flex flex-wrap items-center gap-1.5">
					<Pill tone={project.stage === "DELIVERY" ? "success" : "primary"}>
						{tStage(project.stage)}
					</Pill>
					<span className="text-muted-foreground">
						{[
							project.clientName,
							f.day(project.eventDate),
							project.startTime && `${project.startTime}–${project.endTime}`,
							project.location,
						]
							.filter(Boolean)
							.join(" · ")}
					</span>
				</div>
				{project.price !== null && (
					<p>
						{t("priceLine", {
							price: f.money(project.price),
							advance: f.money(project.advance),
						})}
					</p>
				)}
			</div>

			<SectionTitle icon={Images}>{t("galleriesTitle")}</SectionTitle>
			{data.galleries.length === 0 ? (
				<EmptyLine>{t("noGalleries")}</EmptyLine>
			) : (
				<Rows>
					{data.galleries.map((gallery) => (
						<li key={gallery.id}>
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50"
								onClick={() =>
									setOpenGallery(openGallery === gallery.id ? null : gallery.id)
								}
							>
								<span className="min-w-0 flex-1 truncate text-sm">
									{gallery.title}
								</span>
								<Pill>{tKind(gallery.kind)}</Pill>
								<span className="text-[11px] text-muted-foreground">
									{t("photoCount", { count: gallery.itemCount })}
								</span>
								{gallery.shared && <Pill tone="success">{t("shared")}</Pill>}
							</button>
							<div
								className={cn(
									"px-3 pb-2.5",
									openGallery !== gallery.id && "hidden",
								)}
							>
								{openGallery === gallery.id && (
									<div className="flex flex-col gap-2">
										<MediaStrip projectId={project.id} galleryId={gallery.id} />
										{!gallery.shared && (
											<AskButton
												prompt={t("prompts.shareGallery", {
													gallery: gallery.title,
													title: project.title,
												})}
											>
												{t("shareGallery")}
											</AskButton>
										)}
									</div>
								)}
							</div>
						</li>
					))}
				</Rows>
			)}

			{data.team.length > 0 && (
				<>
					<SectionTitle icon={Users}>{t("team")}</SectionTitle>
					<p className="px-3 py-2 text-xs">
						{data.team
							.map((m) => `${m.name}${m.role ? ` (${m.role})` : ""}`)
							.join(", ")}
					</p>
				</>
			)}
			{data.invoices.length > 0 && (
				<Rows>
					{data.invoices.map((invoice) => (
						<InvoiceRowItem key={invoice.id} invoice={invoice} />
					))}
				</Rows>
			)}
		</CardFrame>
	);
}
