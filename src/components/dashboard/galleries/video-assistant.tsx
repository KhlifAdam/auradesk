"use client";

import { Clapperboard, Loader2, RotateCcw, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useErrorMessage } from "@/hooks/use-error-message";
import { formatDuration } from "@/lib/format";
import { MOSTLY_SILENT } from "@/services/ai/options";
import {
	analyzeNextVideo,
	resetVideoAnalysis,
} from "@/services/ai/video-actions";
import type { VideoInsights } from "@/services/ai/video-queries";
import { VideoTimeline } from "./video-timeline";

/**
 * The AI video assistant: finds the shots and silences of each clip (one
 * video per request, with progress) and labels clips when vision is on.
 */
export function VideoAssistant({
	galleryId,
	insights,
}: {
	galleryId: string;
	insights: VideoInsights;
}) {
	const t = useTranslations("Ai.video");
	const tCategory = useTranslations("Ai.videoCategories");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [done, setDone] = useState<number | null>(null);
	const [isPending, startTransition] = useTransition();
	const pending = insights.videos - insights.analysed;
	const running = done !== null;

	const analyse = async () => {
		let count = insights.analysed;
		setDone(count);
		while (true) {
			const result = await analyzeNextVideo(galleryId);
			if (!result.ok) {
				toast.error(errorMessage(result.error));
				break;
			}
			count++;
			setDone(count);
			if (result.data.remaining === 0) {
				toast.success(t("done"));
				break;
			}
		}
		setDone(null);
		router.refresh();
	};

	const reset = () =>
		startTransition(async () => {
			const result = await resetVideoAnalysis(galleryId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			router.refresh();
		});

	if (insights.videos === 0) return null;

	return (
		<section className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Clapperboard className="h-4 w-4 text-primary" />
					<h2 className="text-sm font-semibold">{t("title")}</h2>
					<span className="text-xs text-muted-foreground">
						{t("analysed", {
							count: insights.analysed,
							total: insights.videos,
						})}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					{insights.analysed > 0 && !running && (
						<Button
							size="sm"
							variant="ghost"
							className="h-7 gap-1.5 text-xs"
							disabled={isPending}
							onClick={reset}
						>
							<RotateCcw className="h-3.5 w-3.5" />
							{t("reset")}
						</Button>
					)}
					{(pending > 0 || running) && (
						<Button
							size="sm"
							className="h-7 gap-1.5 text-xs"
							disabled={running}
							onClick={analyse}
						>
							{running ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Clapperboard className="h-3.5 w-3.5" />
							)}
							{t("start", { count: pending })}
						</Button>
					)}
				</div>
			</div>
			{running && (
				<Progress
					value={(done / Math.max(1, insights.videos)) * 100}
					className="h-1.5"
				/>
			)}
			{insights.reports.length > 0 && (
				<ul className="flex flex-col gap-2">
					{insights.reports.map((report) => (
						<li
							key={report.itemId}
							className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2"
						>
							<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
								<span className="max-w-56 truncate font-medium">
									{report.filename}
								</span>
								{report.category && (
									<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
										{tCategory(report.category)}
									</Badge>
								)}
								<span className="text-muted-foreground">
									{formatDuration(report.durationSec)} ·{" "}
									{t("shots", { count: report.sceneCuts.length + 1 })} ·{" "}
									{report.hasAudio
										? t("silent", {
												percent: Math.round(report.silenceRatio * 100),
											})
										: t("noAudio")}
								</span>
								{report.hasAudio && report.silenceRatio >= MOSTLY_SILENT && (
									<span className="flex items-center gap-1 text-primary">
										<VolumeX className="h-3 w-3" />
										{t("mostlySilent")}
									</span>
								)}
							</div>
							{report.summary && (
								<p className="text-xs text-muted-foreground">
									{report.summary}
								</p>
							)}
							<VideoTimeline report={report} />
						</li>
					))}
				</ul>
			)}
			{!insights.visionEnabled && (
				<p className="text-[11px] text-muted-foreground">{t("noVision")}</p>
			)}
		</section>
	);
}
