"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type PointerEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useErrorMessage } from "@/hooks/use-error-message";
import { focusPosition } from "@/lib/media-focus";
import { setMediaFocus } from "@/services/media/actions";
import type { MediaItem } from "@/services/media/types";

/** Crops the photo is commonly shown in, to check the framing. */
const SAMPLES = [
	{ key: "square", ratio: "1 / 1" },
	{ key: "landscape", ratio: "16 / 9" },
	{ key: "portrait", ratio: "4 / 5" },
] as const;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

interface MediaFocusDialogProps {
	media: MediaItem;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved?: (focus: { focusX: number; focusY: number }) => void;
}

/** Click or drag on the photo to choose what stays visible when it's cropped. */
export function MediaFocusDialog({
	media,
	open,
	onOpenChange,
	onSaved,
}: MediaFocusDialogProps) {
	const t = useTranslations("Media.focus");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	const [focus, setFocus] = useState({
		focusX: media.focusX,
		focusY: media.focusY,
	});

	useEffect(() => {
		if (open) setFocus({ focusX: media.focusX, focusY: media.focusY });
	}, [open, media.focusX, media.focusY]);

	const pick = (event: PointerEvent<HTMLDivElement>) => {
		const box = event.currentTarget.getBoundingClientRect();
		setFocus({
			focusX: clamp(((event.clientX - box.left) / box.width) * 100),
			focusY: clamp(((event.clientY - box.top) / box.height) * 100),
		});
	};

	const save = () =>
		startTransition(async () => {
			const result = await setMediaFocus({ id: media.id, ...focus });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("saved"));
			onSaved?.(focus);
			onOpenChange(false);
			router.refresh();
		});

	const ratio =
		media.width && media.height ? `${media.width} / ${media.height}` : "4 / 3";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
					<div className="flex max-h-[55vh] items-center justify-center rounded-lg bg-muted/50">
						<div
							role="presentation"
							className="relative max-h-[55vh] w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg"
							style={{ aspectRatio: ratio, maxWidth: `calc(55vh * ${ratio})` }}
							onPointerDown={(event) => {
								event.currentTarget.setPointerCapture(event.pointerId);
								pick(event);
							}}
							onPointerMove={(event) => {
								if (event.buttons === 1) pick(event);
							}}
						>
							<Image
								src={media.url}
								alt={media.alt ?? media.filename}
								fill
								sizes="640px"
								draggable={false}
								className="object-contain"
							/>
							<span
								aria-hidden
								className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)] transition-[left,top] duration-75"
								style={{ left: `${focus.focusX}%`, top: `${focus.focusY}%` }}
							/>
						</div>
					</div>
					<div className="flex gap-2 sm:flex-col">
						{SAMPLES.map(({ key, ratio: sample }) => (
							<figure key={key} className="flex flex-1 flex-col gap-1">
								<div
									className="relative w-full overflow-hidden rounded-md bg-muted"
									style={{ aspectRatio: sample }}
								>
									<Image
										src={media.url}
										alt=""
										fill
										sizes="144px"
										className="object-cover"
										style={{ objectPosition: focusPosition(focus) }}
									/>
								</div>
								<figcaption className="text-[10px] text-muted-foreground">
									{t(`samples.${key}`)}
								</figcaption>
							</figure>
						))}
					</div>
				</div>
				<DialogFooter className="gap-2 sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setFocus({ focusX: 50, focusY: 50 })}
					>
						{t("center")}
					</Button>
					<Button type="button" size="sm" onClick={save} disabled={isPending}>
						{isPending && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
