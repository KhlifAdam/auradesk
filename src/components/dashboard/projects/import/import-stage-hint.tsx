"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { updateProjectStage } from "@/services/projects/actions";

/**
 * Shown while the project is still before the Import step of its workflow:
 * says the first file moves it there, or offers to move it by hand when the
 * automatic workflow is off.
 */
export function ImportStageHint({
	projectId,
	auto,
}: {
	projectId: string;
	auto: boolean;
}) {
	const t = useTranslations("Projects.import");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const move = () =>
		startTransition(async () => {
			const result = await updateProjectStage({
				id: projectId,
				stage: "IMPORT",
			});
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("stageMoved"));
			router.refresh();
		});

	return (
		<div className="flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
			<p className="text-xs text-muted-foreground">
				{t(auto ? "stageAutoHint" : "stageHint")}
			</p>
			{!auto && (
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-xs"
					disabled={isPending}
					onClick={move}
				>
					{isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
					{t("moveToImport")}
				</Button>
			)}
		</div>
	);
}
