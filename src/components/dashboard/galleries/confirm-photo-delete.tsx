"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { GalleryKind, GalleryPhoto } from "@/services/galleries/types";

/**
 * Asks before a photo leaves the gallery. A proof only loses its light copy
 * (the original stays on disk); a final is deleted for good.
 */
export function ConfirmPhotoDelete({
	photo,
	kind,
	onCancel,
	onConfirm,
}: {
	/** The photo to delete; null keeps the dialog closed. */
	photo: GalleryPhoto | null;
	kind: GalleryKind;
	onCancel: () => void;
	onConfirm: (photo: GalleryPhoto) => Promise<void>;
}) {
	const t = useTranslations("Galleries.deletePhoto");
	const [isPending, startTransition] = useTransition();

	return (
		<AlertDialog
			open={photo !== null}
			onOpenChange={(open) => !open && !isPending && onCancel()}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t(kind === "PROOFS" ? "proof" : "final", {
							name: photo?.filename ?? "",
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>
						{t("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={(event) => {
							// Stay open (with a spinner) until the deletion settles.
							event.preventDefault();
							if (photo) startTransition(() => onConfirm(photo));
						}}
					>
						{isPending && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
