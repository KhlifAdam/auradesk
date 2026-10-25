"use client";

import { Trash2 } from "lucide-react";
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
import { deleteBook } from "@/services/books/actions";
import { deleteStudioBook } from "@/services/books/studio-book-actions";

/** Deletes a book design (never the photos it used), after a confirmation. */
export function DeleteBookButton({
	bookId,
	title,
	studio = false,
}: {
	bookId: string;
	title: string;
	/** A book the studio made: removed through the studio's action, then back to the list. */
	studio?: boolean;
}) {
	const t = useTranslations("PhotoBook.delete");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();

	const remove = () =>
		startTransition(async () => {
			const result = await (studio ? deleteStudioBook : deleteBook)(bookId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("done"));
			if (studio) router.push("/dashboard/books");
			else router.refresh();
		});

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground hover:text-destructive"
					aria-label={t("button")}
					title={t("button")}
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("description", { title })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction disabled={pending} onClick={remove}>
						{t("confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
