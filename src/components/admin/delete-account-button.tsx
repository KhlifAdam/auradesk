"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { deleteAccount } from "@/services/admin/account-actions";
import { useAdminAction } from "./use-admin-action";

/**
 * Soft-deletes an account. The admin types its name to confirm, as the account
 * can't be restored from the app.
 */
export function DeleteAccountButton({
	userId,
	name,
}: {
	userId: string;
	name: string;
}) {
	const t = useTranslations("Admin.delete");
	const [reason, setReason] = useState("");
	const [typed, setTyped] = useState("");
	const { isPending, run } = useAdminAction();
	const confirmed = typed.trim() === name.trim();

	return (
		<AlertDialog
			onOpenChange={() => {
				setReason("");
				setTyped("");
			}}
		>
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
						<Trash2 className="h-3.5 w-3.5" />
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
				<Input
					value={typed}
					onChange={(event) => setTyped(event.target.value)}
					placeholder={t("typeName", { name })}
					className="h-8 text-sm"
				/>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={!confirmed}
						onClick={() =>
							run(() => deleteAccount({ userId, reason }), t("done"))
						}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{t("confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
