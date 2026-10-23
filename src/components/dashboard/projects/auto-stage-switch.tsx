"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import { setAutoAdvanceStages } from "@/services/projects/auto-stage-actions";

/** Studio-wide switch for the workflow that follows the work. */
export function AutoStageSwitch({ enabled }: { enabled: boolean }) {
	const t = useTranslations("Projects.detail.auto");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [optimistic, setOptimistic] = useOptimistic(enabled);
	const [isPending, startTransition] = useTransition();
	const id = useId();

	const toggle = (next: boolean) =>
		startTransition(async () => {
			setOptimistic(next);
			const result = await setAutoAdvanceStages(next);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(next ? t("enabled") : t("disabled"));
			router.refresh();
		});

	return (
		<div className="flex items-center gap-2" title={t("scope")}>
			<label
				htmlFor={id}
				className="cursor-pointer text-xs text-muted-foreground"
			>
				{t("label")}
			</label>
			<Switch
				id={id}
				checked={optimistic}
				onCheckedChange={toggle}
				disabled={isPending}
				className="scale-90"
			/>
		</div>
	);
}
