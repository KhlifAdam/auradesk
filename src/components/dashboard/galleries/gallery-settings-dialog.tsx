"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import {
	SwitchField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { deleteGallery, updateGallery } from "@/services/galleries/actions";
import {
	type GallerySettingsValues,
	gallerySettingsSchema,
} from "@/services/galleries/schemas";
import type { GalleryView } from "@/services/galleries/types";

export function GallerySettingsDialog({ gallery }: { gallery: GalleryView }) {
	const t = useTranslations("Galleries.settings");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const values: GallerySettingsValues = {
		title: gallery.title,
		description: gallery.description,
		selectionEnabled: gallery.selectionEnabled,
		selectionLimit: gallery.selectionLimit,
		watermark: gallery.watermark,
		linkSharing: gallery.linkSharing,
	};
	const form = useForm<GallerySettingsValues>({
		resolver: zodResolver(gallerySettingsSchema),
		defaultValues: values,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(next: GallerySettingsValues) {
		const result = await updateGallery({ ...next, id: gallery.id });
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("saved"));
		setOpen(false);
		router.refresh();
	}

	async function onDelete() {
		const result = await deleteGallery(gallery.id);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("deleted"));
		router.push(`/dashboard/projects/${gallery.projectId}`);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(values);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
					<Settings2 className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						<TextField<GallerySettingsValues> name="title" label={t("name")} />
						<TextField<GallerySettingsValues>
							name="description"
							label={t("descriptionLabel")}
							rows={2}
						/>
						<SwitchField<GallerySettingsValues>
							name="selectionEnabled"
							label={t("selection")}
							description={t("selectionHint")}
						/>
						<TextField<GallerySettingsValues>
							name="selectionLimit"
							label={t("limit")}
							description={t("limitHint")}
							type="number"
						/>
						<SwitchField<GallerySettingsValues>
							name="watermark"
							label={t("watermark")}
							description={t("watermarkHint")}
						/>
						<SwitchField<GallerySettingsValues>
							name="linkSharing"
							label={t("linkSharing")}
							description={t(
								gallery.share ? "linkSharingActive" : "linkSharingHint",
							)}
						/>
						<DialogFooter className="mt-1 flex-row items-center sm:justify-between">
							<ConfirmDeleteButton
								title={t("deleteTitle")}
								description={t("deleteDescription")}
								onConfirm={onDelete}
							/>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
