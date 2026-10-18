"use client";

import { Crosshair, Loader2, PanelTop } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { GalleryCover } from "@/components/client-work/gallery-cover";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { updateGalleryCover } from "@/services/galleries/cover-actions";
import { COVER_TEMPLATES } from "@/services/galleries/schemas";
import type { CoverTemplate, GalleryView } from "@/services/galleries/types";

const bar = "h-1 rounded-full bg-current";

/** Tiny drawing of a layout: photo as a block, text as bars. */
function Sketch({ template }: { template: CoverTemplate }) {
	const photo = "bg-muted-foreground/35";
	if (template === "SPLIT")
		return (
			<span className="grid flex-1 grid-cols-2">
				<span className="flex flex-col justify-center gap-1 p-1.5 text-muted-foreground/60">
					<span className={cn(bar, "w-3/4")} />
					<span className={cn(bar, "w-1/2")} />
				</span>
				<span className={photo} />
			</span>
		);
	if (template === "FRAME")
		return (
			<span className="flex flex-1 flex-col items-center gap-1 p-1.5 text-muted-foreground/60">
				<span className={cn("w-3/4 flex-1 rounded-sm", photo)} />
				<span className={cn(bar, "w-1/2")} />
			</span>
		);
	if (template === "NONE")
		return (
			<span className="flex flex-1 flex-col justify-start gap-1 p-1.5 text-muted-foreground/60">
				<span className={cn(bar, "w-1/2")} />
			</span>
		);
	return (
		<span
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-1 text-background",
				photo,
			)}
		>
			<span className={cn(bar, "w-1/2")} />
			<span className={cn(bar, "w-1/3")} />
		</span>
	);
}

/**
 * The gallery's cover page: its layout, and the point of the photo kept in
 * frame (click the photo). The preview is the very component clients see.
 */
export function CoverDialog({ gallery }: { gallery: GalleryView }) {
	const t = useTranslations("Galleries.cover");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [template, setTemplate] = useState(gallery.cover.template);
	const [focal, setFocal] = useState({
		x: gallery.cover.focalX,
		y: gallery.cover.focalY,
	});
	const [isPending, startTransition] = useTransition();
	const imageUrl = gallery.cover.imageUrl;

	const save = () =>
		startTransition(async () => {
			const result = await updateGalleryCover({
				galleryId: gallery.id,
				template,
				focalX: focal.x,
				focalY: focal.y,
			});
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("saved"));
			router.refresh();
		});

	const pickFocal = (event: React.MouseEvent<HTMLButtonElement>) => {
		const box = event.currentTarget.getBoundingClientRect();
		const clamp = (value: number) => Math.min(1, Math.max(0, value));
		setFocal({
			x: clamp((event.clientX - box.left) / box.width),
			y: clamp((event.clientY - box.top) / box.height),
		});
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
					<PanelTop className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<fieldset className="grid grid-cols-4 gap-2">
						<legend className="sr-only">{t("layout")}</legend>
						{COVER_TEMPLATES.map((option) => (
							<button
								key={option}
								type="button"
								aria-pressed={template === option}
								onClick={() => setTemplate(option)}
								className={cn(
									"flex flex-col gap-1.5 rounded-lg border p-2 text-left text-xs font-medium transition-all duration-200",
									template === option
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/40",
								)}
							>
								<span className="flex aspect-[16/10] overflow-hidden rounded bg-muted">
									<Sketch template={option} />
								</span>
								{t(`templates.${option}`)}
							</button>
						))}
					</fieldset>
					{imageUrl && template !== "NONE" ? (
						<div className="grid gap-4 sm:grid-cols-[180px_1fr]">
							<div className="flex flex-col gap-1.5">
								<p className="flex items-center gap-1 text-xs font-medium">
									<Crosshair className="h-3.5 w-3.5 text-primary" />
									{t("focal")}
								</p>
								<button
									type="button"
									onClick={pickFocal}
									aria-label={t("focalHint")}
									className="relative aspect-[4/3] w-full cursor-crosshair overflow-hidden rounded-md ring-1 ring-border"
								>
									<Image
										src={imageUrl}
										alt=""
										fill
										unoptimized
										className="object-cover"
									/>
									<span
										className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]"
										style={{
											left: `${focal.x * 100}%`,
											top: `${focal.y * 100}%`,
										}}
									/>
								</button>
								<p className="text-[11px] text-muted-foreground">
									{t("focalHint")}
								</p>
							</div>
							<GalleryCover
								preview
								cover={{
									...gallery.cover,
									template,
									focalX: focal.x,
									focalY: focal.y,
								}}
								title={gallery.title}
								studioName={gallery.studioName}
							/>
						</div>
					) : (
						<p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
							{t(imageUrl ? "noneHint" : "emptyHint")}
						</p>
					)}
					<p className="text-[11px] text-muted-foreground">{t("photoHint")}</p>
					<Button
						size="sm"
						className="h-8 w-fit gap-1.5 self-end text-xs"
						disabled={isPending}
						onClick={save}
					>
						{isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{t("save")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
