"use client";

import { Crosshair, ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaFilter } from "@/services/media/schemas";
import type { MediaItem } from "@/services/media/types";
import { MediaFocusDialog } from "./media-focus-dialog";
import { MediaPicker } from "./media-picker";
import { MediaThumb } from "./media-thumb";

interface MediaFieldProps {
	/** Selected media id (the form value). */
	value: string | null;
	onChange: (id: string | null) => void;
	/** Media for the initial value, used for the preview. */
	initialMedia?: MediaItem | null;
	type?: MediaFilter;
	className?: string;
}

/** Form control that stores a media id and previews it, with picker + clear. */
export function MediaField({
	value,
	onChange,
	initialMedia = null,
	type = "image",
	className,
}: MediaFieldProps) {
	const t = useTranslations("Media.field");
	const [open, setOpen] = useState(false);
	const [framing, setFraming] = useState(false);
	const [preview, setPreview] = useState<MediaItem | null>(initialMedia);
	const current = value && preview?.id === value ? preview : null;

	return (
		<div className={cn("flex items-center gap-3", className)}>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/60"
			>
				{current ? (
					<MediaThumb media={current} sizes="64px" />
				) : (
					<ImagePlus className="m-auto h-5 w-5 text-muted-foreground" />
				)}
			</button>
			<div className="flex flex-col items-start gap-1">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					onClick={() => setOpen(true)}
				>
					{current ? t("replace") : t("choose")}
				</Button>
				{current?.type === "IMAGE" && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 gap-1 px-2 text-xs text-muted-foreground"
						onClick={() => setFraming(true)}
					>
						<Crosshair className="h-3 w-3" />
						{t("adjust")}
					</Button>
				)}
				{current && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 gap-1 px-2 text-xs text-muted-foreground"
						onClick={() => onChange(null)}
					>
						<X className="h-3 w-3" />
						{t("remove")}
					</Button>
				)}
			</div>
			{current?.type === "IMAGE" && (
				<MediaFocusDialog
					media={current}
					open={framing}
					onOpenChange={setFraming}
					onSaved={(focus) => setPreview({ ...current, ...focus })}
				/>
			)}
			<MediaPicker
				open={open}
				onOpenChange={setOpen}
				type={type}
				onConfirm={([media]) => {
					if (!media) return;
					setPreview(media);
					onChange(media.id);
				}}
			/>
		</div>
	);
}
