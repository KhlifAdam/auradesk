"use client";

import { Film, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getProjectMediaPreview } from "@/services/assistant/actions";
import type { MediaPreview } from "@/services/assistant/types";

/** A project's (or one gallery's) first photos, loaded when a card is expanded. */
export function MediaStrip({
	projectId,
	galleryId,
}: {
	projectId: string;
	galleryId?: string;
}) {
	const t = useTranslations("Assistant.cards");
	const [preview, setPreview] = useState<MediaPreview | null | undefined>();

	useEffect(() => {
		let alive = true;
		getProjectMediaPreview({ projectId, galleryId })
			.then((result) => alive && setPreview(result.ok ? result.data : null))
			.catch(() => alive && setPreview(null));
		return () => {
			alive = false;
		};
	}, [projectId, galleryId]);

	if (preview === undefined)
		return (
			<div className="grid grid-cols-4 gap-1">
				{Array.from({ length: 4 }, (_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders.
						key={i}
						className="aspect-square animate-pulse rounded-md bg-muted"
					/>
				))}
			</div>
		);

	if (!preview || preview.items.length === 0)
		return (
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<ImageOff className="h-3.5 w-3.5" />
				{t("noMedia")}
			</p>
		);

	const more = preview.total - preview.items.length;
	return (
		<div className="flex flex-col gap-1.5">
			<div className="grid grid-cols-4 gap-1">
				{preview.items.map((item) => (
					<div
						key={item.id}
						className="relative aspect-square overflow-hidden rounded-md bg-muted"
					>
						<Image
							src={item.url}
							alt={item.filename}
							fill
							sizes="96px"
							unoptimized
							className="object-cover transition-transform duration-300 hover:scale-105"
						/>
						{item.isVideo && (
							<Film className="absolute right-1 bottom-1 h-3 w-3 text-white drop-shadow" />
						)}
					</div>
				))}
			</div>
			<Link
				href={`/dashboard/projects/${projectId}`}
				className="w-fit text-[11px] text-primary hover:underline"
			>
				{more > 0 ? t("morePhotos", { count: more }) : t("viewProject")}
			</Link>
		</div>
	);
}
