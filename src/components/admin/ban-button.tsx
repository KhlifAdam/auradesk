"use client";

import { Ban, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { useErrorMessage } from "@/hooks/use-error-message";
import { banAccount, unbanAccount } from "@/services/admin/actions";

/** Suspends an account (with an optional reason), or lifts the suspension. */
export function BanButton({
	userId,
	name,
	banned,
}: {
	userId: string;
	name: string;
	banned: boolean;
}) {
	const t = useTranslations("Admin.ban");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [reason, setReason] = useState("");
	const [isPending, startTransition] = useTransition();

	const run = (action: () => ReturnType<typeof unbanAccount>, done: string) =>
		startTransition(async () => {
			const result = await action();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			router.refresh();
		});

	if (banned)
		return (
			<Button
				size="sm"
				variant="outline"
				className="h-7 gap-1.5 text-xs"
				disabled={isPending}
				onClick={() => run(() => unbanAccount(userId), t("lifted"))}
			>
				<RotateCcw className="h-3.5 w-3.5" />
				{t("lift")}
			</Button>
		);

	return (
		<AlertDialog onOpenChange={() => setReason("")}>
			<AlertDialogTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
					disabled={isPending}
				>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Ban className="h-3.5 w-3.5" />
					)}
					{t("button")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("title", { name })}</AlertDialogTitle>
					<AlertDialogDescription>{t("description")}</AlertDialogDescription>
				</AlertDialogHeader>
				<Input
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					placeholder={t("reason")}
					maxLength={300}
					className="h-8 text-sm"
				/>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => run(() => banAccount({ userId, reason }), t("done"))}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{t("confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
