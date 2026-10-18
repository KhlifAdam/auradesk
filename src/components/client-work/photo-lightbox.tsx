"use client";

import { ChevronLeft, ChevronRight, Download, Lock } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { GalleryPhoto } from "@/services/galleries/types";

interface PhotoLightboxProps {
	items: GalleryPhoto[];
	index: number | null;
	onIndexChange: (index: number | null) => void;
	/** Controls for the open photo (select, comments). */
	renderActions?: (photo: GalleryPhoto) => ReactNode;
	/** False while the client is choosing: previews only, no video, no download. */
	originals?: boolean;
	/** Share-link token, so a visitor without an account can download. */
	token?: string;
}

const arrowClass =
	"absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25";

/** Full-size view of private gallery photos and videos (signed URLs, not optimized). */
export function PhotoLightbox({
	items,
	index,
	onIndexChange,
	renderActions,
	token,
	originals = true,
}: PhotoLightboxProps) {
	const t = useTranslations("Galleries.lightbox");
	const photo = index !== null ? (items[index] ?? null) : null;

	useEffect(() => {
		if (index === null) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowRight") onIndexChange((index + 1) % items.length);
			if (event.key === "ArrowLeft")
				onIndexChange((index - 1 + items.length) % items.length);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [index, items.length, onIndexChange]);

	return (
		<Dialog
			open={photo !== null}
			onOpenChange={(open) => !open && onIndexChange(null)}
		>
			<DialogContent className="h-[90vh] max-w-[95vw] border-0 bg-black/95 p-0 text-white sm:max-w-6xl">
				<DialogTitle className="sr-only">
					{photo?.filename ?? t("title")}
				</DialogTitle>
				{photo && index !== null && (
					<div className="relative h-full w-full">
						{photo.type === "VIDEO" && originals && photo.fullUrl ? (
							// The signed URL supports range requests, so seeking works.
							<video
								key={photo.id}
								src={photo.fullUrl}
								poster={photo.previewUrl ?? undefined}
								controls
								playsInline
								preload="metadata"
								className="h-full w-full object-contain p-4 pb-16"
							>
								<track kind="captions" />
							</video>
						) : photo.type === "IMAGE" && photo.fullUrl ? (
							<Image
								key={photo.id}
								src={photo.fullUrl}
								alt={photo.filename}
								fill
								unoptimized
								className="object-contain p-4"
							/>
						) : (
							// A video before delivery: its poster only.
							<div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 pb-16">
								{photo.previewUrl && (
									<div className="relative h-3/4 w-full">
										<Image
											key={photo.id}
											src={photo.previewUrl}
											alt={photo.filename}
											fill
											unoptimized
											className="object-contain"
										/>
									</div>
								)}
								<p className="flex items-center gap-1.5 text-sm text-white/70">
									<Lock className="h-4 w-4" />
									{t("videoLocked")}
								</p>
							</div>
						)}
						<div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent px-5 py-4 text-sm text-white/80">
							<span className="flex min-w-0 flex-col">
								<span className="truncate">{photo.filename}</span>
								{!originals && (
									<span className="text-xs text-white/50">
										{t("previewOnly")}
									</span>
								)}
							</span>
							<div className="flex shrink-0 items-center gap-3">
								{renderActions?.(photo)}
								{originals && (
									<a
										href={`/api/galleries/items/${photo.id}/download${token ? `?t=${token}` : ""}`}
										aria-label={t("download")}
										title={t("download")}
										className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
									>
										<Download className="h-4 w-4" />
									</a>
								)}
								<span className="tabular-nums">
									{index + 1} / {items.length}
								</span>
							</div>
						</div>
						{items.length > 1 && (
							<>
								<button
									type="button"
									aria-label={t("previous")}
									className={`${arrowClass} left-3`}
									onClick={() =>
										onIndexChange((index - 1 + items.length) % items.length)
									}
								>
									<ChevronLeft className="h-5 w-5" />
								</button>
								<button
									type="button"
									aria-label={t("next")}
									className={`${arrowClass} right-3`}
									onClick={() => onIndexChange((index + 1) % items.length)}
								>
									<ChevronRight className="h-5 w-5" />
								</button>
							</>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
