"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaKind } from "@/lib/projects/estimate";
import { cn } from "@/lib/utils";
import {
	PROJECT_STAGES,
	type ProjectStage,
	stageIndex,
} from "@/services/projects/stages";

interface StageTimelineProps {
	stage: ProjectStage;
	/** Makes each step clickable (photographer only). */
	onSelect?: (stage: ProjectStage) => void;
	disabled?: boolean;
	/** Steps that can't be picked, with the reason shown on hover. */
	locked?: { stage: ProjectStage; reason: string };
	/** Video projects call post-production what it is: video editing. */
	media?: MediaKind;
}

/** The project workflow as a row of steps; past steps are checked. */
export function StageTimeline({
	stage,
	onSelect,
	disabled,
	locked,
	media,
}: StageTimelineProps) {
	const t = useTranslations("Projects.stages");
	const tMedia = useTranslations("Projects.stagesByMedia");
	const current = stageIndex(stage);
	const label = (step: ProjectStage) =>
		step === "POST_PRODUCTION" && (media === "VIDEO" || media === "BOTH")
			? tMedia(media)
			: t(step);

	return (
		<ol className="grid grid-cols-5 gap-1.5 md:grid-cols-10">
			{PROJECT_STAGES.map((step, index) => {
				const state =
					index < current ? "done" : index === current ? "current" : "next";
				const content = (
					<>
						<span
							className={cn(
								"flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors duration-300",
								state === "done" &&
									"border-primary bg-primary text-primary-foreground",
								state === "current" &&
									"border-primary text-primary ring-2 ring-primary/20",
								state === "next" && "border-border text-muted-foreground",
							)}
						>
							{state === "done" ? <Check className="h-3 w-3" /> : index + 1}
						</span>
						<span
							className={cn(
								"line-clamp-2 text-center text-[10px] leading-tight",
								state === "next" ? "text-muted-foreground" : "text-foreground",
								state === "current" && "font-semibold",
							)}
						>
							{label(step)}
						</span>
					</>
				);
				return (
					<li
						key={step}
						aria-current={state === "current" ? "step" : undefined}
					>
						{onSelect ? (
							<button
								type="button"
								disabled={
									disabled || state === "current" || locked?.stage === step
								}
								title={locked?.stage === step ? locked.reason : undefined}
								onClick={() => onSelect(step)}
								className="flex w-full flex-col items-center gap-1 rounded-lg p-1.5 transition-colors hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
							>
								{content}
							</button>
						) : (
							<div className="flex flex-col items-center gap-1 p-1.5">
								{content}
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}
