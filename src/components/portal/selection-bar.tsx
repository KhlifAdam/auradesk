"use client";

import { CheckCircle2, Heart, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { submitSelection } from "@/services/galleries/selection-actions";

interface SelectionBarProps {
	galleryId: string;
	selectedCount: number;
	limit: number | null;
	submitted: boolean;
}

/** Sticky picks counter with the submit step. */
export function SelectionBar({
	galleryId,
	selectedCount,
	limit,
	submitted,
}: SelectionBarProps) {
	const t = useTranslations("Portal.selection");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const submit = () =>
		startTransition(async () => {
			const result = await submitSelection(galleryId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("submittedToast"));
			router.refresh();
		});

	return (
		<div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 md:bottom-4 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-full border border-border bg-background/85 py-2 pl-4 pr-2 shadow-luminous-lg backdrop-blur-xl">
			<p className="flex items-center gap-2 text-sm">
				<Heart className="h-4 w-4 fill-primary text-primary" />
				<span className="font-semibold tabular-nums">
					{limit ? `${selectedCount} / ${limit}` : selectedCount}
				</span>
				<span className="text-muted-foreground">{t("selected")}</span>
			</p>
			{submitted ? (
				<span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
					<CheckCircle2 className="h-3.5 w-3.5" />
					{t("submitted")}
				</span>
			) : (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							size="sm"
							className="h-8 gap-1.5 rounded-full text-xs"
							disabled={selectedCount === 0 || isPending}
						>
							{isPending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Send className="h-3.5 w-3.5" />
							)}
							{t("submit")}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
							<AlertDialogDescription>
								{t("confirmDescription", { count: selectedCount })}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
							<AlertDialogAction onClick={submit}>
								{t("confirm")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}
