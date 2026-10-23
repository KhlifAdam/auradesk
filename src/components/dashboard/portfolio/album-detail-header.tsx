"use client";

import { ArrowLeft, Library, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/dashboard/media/media-picker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import { updateAlbum } from "@/services/portfolio/actions";
import { addAlbumItems } from "@/services/portfolio/item-actions";
import type { AlbumDetail } from "@/services/portfolio/types";
import { AlbumFormDialog } from "./album-form-dialog";

export function AlbumDetailHeader({ album }: { album: AlbumDetail }) {
	const t = useTranslations("Portfolio");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [editOpen, setEditOpen] = useState(false);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const togglePublished = (published: boolean) =>
		startTransition(async () => {
			const { id, title, slug, description } = album;
			const result = await updateAlbum({
				id,
				title,
				slug,
				description,
				published,
			});
			if (!result.ok) return void toast.error(errorMessage(result.error));
			router.refresh();
		});

	const addItems = (mediaIds: string[]) =>
		startTransition(async () => {
			const result = await addAlbumItems({ albumId: album.id, mediaIds });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("album.added", { count: mediaIds.length }));
			router.refresh();
		});

	return (
		<div className="flex flex-wrap items-end justify-between gap-3">
			<div className="flex flex-col gap-1">
				<Link
					href="/dashboard/portfolio"
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3 w-3" />
					{t("title")}
				</Link>
				<h1 className="font-display text-xl font-bold tracking-tight">
					{album.title}
				</h1>
				<p className="text-xs text-muted-foreground">
					{album.description || t("itemCount", { count: album.itemCount })}
				</p>
			</div>
			<div className="flex items-center gap-2">
				<div className="flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-xs font-medium">
					<Switch
						checked={album.published}
						onCheckedChange={togglePublished}
						disabled={isPending}
						className="scale-90"
						aria-label={t("form.published")}
					/>
					{album.published ? t("published") : t("draft")}
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1.5"
					onClick={() => setEditOpen(true)}
				>
					<Pencil className="h-3.5 w-3.5" />
					{t("album.edit")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1.5"
					onClick={() => setPickerOpen(true)}
					disabled={isPending}
				>
					<Library className="h-3.5 w-3.5" />
					{t("album.fromLibrary")}
				</Button>
			</div>
			<AlbumFormDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				album={album}
			/>
			<MediaPicker
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				multiple
				title={t("album.fromLibrary")}
				onConfirm={(media) => addItems(media.map((m) => m.id))}
			/>
		</div>
	);
}
