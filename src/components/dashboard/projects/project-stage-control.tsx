"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { StageTimeline } from "@/components/client-work/stage-timeline";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { MediaKind } from "@/lib/projects/estimate";
import { updateProjectStage } from "@/services/projects/actions";
import type { PaymentStatus } from "@/services/projects/options";
import type { ProjectStage } from "@/services/projects/stages";
import { PAYMENT_GATED_STAGE } from "@/services/projects/visibility";
import { AutoStageSwitch } from "./auto-stage-switch";

/** Clickable workflow; the new stage shows at once and rolls back on error. */
export function ProjectStageControl({
	projectId,
	stage,
	payment,
	autoAdvance,
	media,
}: {
	projectId: string;
	stage: ProjectStage;
	payment: PaymentStatus;
	/** The studio lets projects move forward on their own. */
	autoAdvance: boolean;
	/** Video projects name their editing step for what it is. */
	media?: MediaKind;
}) {
	const t = useTranslations("Projects.detail");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [optimistic, setOptimistic] = useOptimistic(stage);
	const [isPending, startTransition] = useTransition();

	const select = (next: ProjectStage) =>
		startTransition(async () => {
			setOptimistic(next);
			const result = await updateProjectStage({ id: projectId, stage: next });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("stageUpdated"));
			router.refresh();
		});

	return (
		<section className="rounded-xl border border-border bg-card p-3">
			<div className="mb-2 flex items-center justify-between gap-2">
				<h2 className="text-xs font-medium text-muted-foreground">
					{t("workflow")}
				</h2>
				<AutoStageSwitch enabled={autoAdvance} />
			</div>
			<StageTimeline
				stage={optimistic}
				media={media}
				onSelect={select}
				disabled={isPending}
				locked={
					payment === "PAID"
						? undefined
						: { stage: PAYMENT_GATED_STAGE, reason: t("unpaidLocked") }
				}
			/>
			{autoAdvance && (
				<p className="mt-2 text-[11px] text-muted-foreground">
					{t("auto.hint")}
				</p>
			)}
			{payment !== "PAID" && (
				<p className="mt-2 text-xs text-destructive">{t("unpaidHint")}</p>
			)}
		</section>
	);
}
