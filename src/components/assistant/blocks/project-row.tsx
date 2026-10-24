"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProjectRow } from "@/lib/ai/assistant/tools/rows";
import { cn } from "@/lib/utils";
import { AskButton } from "./chat-ask";
import { MediaStrip } from "./media-strip";
import { Pill, useAssistantFormat } from "./primitives";

const PAYMENT_TONE = {
	PAID: "success",
	PARTIAL: "warning",
	UNPAID: "neutral",
} as const;

/** A project line that opens onto its first photos and quick follow-ups. */
export function ProjectRowItem({ project }: { project: ProjectRow }) {
	const t = useTranslations("Assistant.cards");
	const tStage = useTranslations("Projects.stages");
	const tPayment = useTranslations("Projects.payment.status");
	const f = useAssistantFormat();
	const [open, setOpen] = useState(false);

	return (
		<li>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-muted/50"
			>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{project.title}</p>
					<p className="truncate text-xs text-muted-foreground">
						{[project.clientName, f.day(project.eventDate)]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				<Pill tone={project.stage === "DELIVERY" ? "success" : "primary"}>
					{tStage(project.stage)}
				</Pill>
				<ChevronDown
					className={cn(
						"h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
						open && "rotate-180",
					)}
				/>
			</button>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.22, ease: "easeOut" }}
						className="overflow-hidden"
					>
						<div className="flex flex-col gap-2 px-3 pt-1 pb-2.5">
							<div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
								{project.price !== null && (
									<span>{f.money(project.price)}</span>
								)}
								<Pill tone={PAYMENT_TONE[project.paymentStatus]}>
									{tPayment(project.paymentStatus)}
								</Pill>
								<span>{t("galleries", { count: project.galleryCount })}</span>
							</div>
							{project.galleryCount > 0 && (
								<MediaStrip projectId={project.id} />
							)}
							<div className="flex flex-wrap gap-1.5">
								<AskButton
									prompt={t("prompts.projectDetails", { title: project.title })}
								>
									{t("details")}
								</AskButton>
								<AskButton
									prompt={t("prompts.moveStage", { title: project.title })}
								>
									{t("moveStage")}
								</AskButton>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</li>
	);
}
