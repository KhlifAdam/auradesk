"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createGallery } from "@/services/galleries/actions";
import type { GalleryKind } from "@/services/galleries/types";
import { GalleryKindPicker } from "../../galleries/gallery-kind-picker";

interface GalleryPickerProps {
	projectId: string;
	galleries: {
		id: string;
		title: string;
		kind: GalleryKind;
		itemCount: number;
	}[];
	value: string | null;
	onChange: (galleryId: string) => void;
	/** Locked while files are being sent, so none land in the wrong gallery. */
	disabled: boolean;
}

/** Where the files go: an existing gallery of the project, or a new one. */
export function GalleryPicker({
	projectId,
	galleries,
	value,
	onChange,
	disabled,
}: GalleryPickerProps) {
	const t = useTranslations("Projects.import");
	const errorMessage = useErrorMessage();
	const [creating, setCreating] = useState(galleries.length === 0);
	const [title, setTitle] = useState("");
	// Importing a shoot: light proofs by default, the originals stay on disk.
	const [kind, setKind] = useState<GalleryKind>("PROOFS");
	const [isPending, startTransition] = useTransition();

	const create = () =>
		startTransition(async () => {
			const result = await createGallery({ projectId, title, kind });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("galleryCreated"));
			setCreating(false);
			setTitle("");
			onChange(result.data.id);
		});

	if (creating) {
		return (
			<form
				className="flex max-w-xl flex-col gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (title.trim()) create();
				}}
			>
				<GalleryKindPicker value={kind} onChange={setKind} />
				<div className="flex flex-wrap items-center gap-2">
					<Input
						autoFocus
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder={t("newGalleryPlaceholder")}
						aria-label={t("newGallery")}
						maxLength={120}
						className="h-8 w-64 text-sm"
					/>
					<Button
						type="submit"
						size="sm"
						className="h-8 text-xs"
						disabled={isPending || !title.trim()}
					>
						{isPending && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("create")}
					</Button>
					{galleries.length > 0 && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 text-xs"
							onClick={() => setCreating(false)}
						>
							{t("cancel")}
						</Button>
					)}
				</div>
			</form>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Select
				value={value ?? undefined}
				onValueChange={onChange}
				disabled={disabled}
			>
				<SelectTrigger className="h-8 w-64 text-sm" aria-label={t("gallery")}>
					<SelectValue placeholder={t("chooseGallery")} />
				</SelectTrigger>
				<SelectContent>
					{galleries.map((gallery) => (
						<SelectItem key={gallery.id} value={gallery.id} className="text-sm">
							{t("galleryOption", {
								title: gallery.title,
								count: gallery.itemCount,
								kind: gallery.kind,
							})}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-8 gap-1.5 text-xs"
				disabled={disabled}
				onClick={() => setCreating(true)}
			>
				<Plus className="h-3.5 w-3.5" />
				{t("newGallery")}
			</Button>
		</div>
	);
}
