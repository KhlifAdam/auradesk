"use client";

import { Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
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

/** Unlinks the number, after a confirmation. */
export function WhatsappUnlinkButton({
	disabled,
	onConfirm,
}: {
	disabled: boolean;
	onConfirm: () => void;
}) {
	const t = useTranslations("Admin.whatsapp.unlink");

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
					disabled={disabled}
				>
					<Unlink className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("description")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{t("confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
