"use client";

import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useErrorMessage } from "@/hooks/use-error-message";
import { PHOTO_FLAGS } from "@/services/ai/options";
import {
	analyzeGalleryBatch,
	resetGalleryAnalysis,
} from "@/services/ai/photo-actions";
import type { GalleryInsights } from "@/services/ai/photo-queries";

/**
 * The AI photo assistant: runs the analysis in small batches (with progress),
 * then sums up what needs a look and links to the flagged photos.
 */
export function PhotoAssistant({
	galleryId,
	insights,
}: {
	galleryId: string;
	insights: GalleryInsights;
}) {
	const t = useTranslations("Ai.assistant");
	const tFlag = useTranslations("Ai.flags");
	const pathname = usePathname();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [progress, setProgress] = useState<number | null>(null);
	const [isPending, startTransition] = useTransition();
	const pending = insights.photos - insights.analysed;

	const analyse = async () => {
		let done = insights.analysed;
		setProgress(done);
		while (true) {
			const result = await analyzeGalleryBatch(galleryId);
			if (!result.ok) {
				toast.error(errorMessage(result.error));
				break;
			}
			done += result.data.analysed;
			setProgress(done);
			if (result.data.remaining === 0) {
				toast.success(t("done"));
				break;
			}
		}
		setProgress(null);
		router.refresh();
	};

	const reset = () =>
		startTransition(async () => {
			const result = await resetGalleryAnalysis(galleryId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			router.refresh();
		});

	if (insights.photos === 0) return null;
	const running = progress !== null;

	return (
		<section className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Sparkles className="h-4 w-4 text-primary" />
					<h2 className="text-sm font-semibold">{t("title")}</h2>
					<span className="text-xs text-muted-foreground">
						{t("analysed", {
							count: insights.analysed,
							total: insights.photos,
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
								<Sparkles className="h-3.5 w-3.5" />
							)}
							{insights.analysed === 0
								? t("start")
								: t("continue", { count: pending })}
						</Button>
					)}
				</div>
			</div>
			{running && (
				<Progress
					value={(progress / Math.max(1, insights.photos)) * 100}
					className="h-1.5"
				/>
			)}
			{insights.analysed > 0 && (
				<div className="flex flex-wrap items-center gap-1.5 text-xs">
					{PHOTO_FLAGS.filter((flag) => insights.counts[flag] > 0).map(
						(flag) => (
							<span
								key={flag}
								className="rounded-full border border-border bg-card px-2 py-0.5"
							>
								{tFlag(flag)} · {insights.counts[flag]}
							</span>
						),
					)}
					{insights.flagged === 0 ? (
						<span className="text-muted-foreground">{t("allGood")}</span>
					) : (
						<Link
							href={`${pathname}?filter=flagged`}
							className="font-medium text-primary hover:underline"
						>
							{t("review", { count: insights.flagged })}
						</Link>
					)}
				</div>
			)}
			{!insights.visionEnabled && (
				<p className="text-[11px] text-muted-foreground">{t("noVision")}</p>
			)}
		</section>
	);
}
