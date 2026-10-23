"use client";

import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { MediaThumb } from "@/components/dashboard/media/media-thumb";
import { SortableGrid } from "@/components/dashboard/shared/sortable-grid";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { useOptimisticOrder } from "@/hooks/use-optimistic-order";
import { cn } from "@/lib/utils";
import {
	removeAlbumItem,
	reorderAlbumItems,
	setAlbumCover,
} from "@/services/portfolio/item-actions";
import type { AlbumDetail } from "@/services/portfolio/types";

export function AlbumItemsGrid({ album }: { album: AlbumDetail }) {
	const t = useTranslations("Portfolio.album");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const { page } = album;
	const save = useCallback(
		(ids: string[]) => reorderAlbumItems({ albumId: album.id, page, ids }),
		[album.id, page],
	);
	const { items, setItems, reorder } = useOptimisticOrder(album.items, save);

	const run = async (
		action: Promise<{ ok: boolean; error?: string }>,
		success: string,
	) => {
		const result = await action;
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(success);
		router.refresh();
	};

	// The drop area above stands in for an empty album.
	if (album.itemCount === 0) return null;

	return (
		<div className="flex flex-col gap-4">
			<SortableGrid
				items={items}
				onReorder={reorder}
				className="grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
				renderItem={(media) => {
					const isCover = album.coverMediaId === media.id;
					return (
						<div className="group relative overflow-hidden rounded-lg border border-border bg-card">
							<MediaThumb
								media={media}
								sizes="(min-width: 1280px) 12vw, 20vw"
							/>
							{isCover && (
								<span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
									{t("cover")}
								</span>
							)}
							<div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
								<Button
									type="button"
									size="icon"
									variant="secondary"
									className="h-6 w-6 bg-background/80 backdrop-blur"
									aria-label={isCover ? t("unsetCover") : t("setCover")}
									onPointerDown={(event) => event.stopPropagation()}
									onClick={() =>
										run(
											setAlbumCover({
												albumId: album.id,
												mediaId: isCover ? null : media.id,
											}),
											isCover ? t("coverCleared") : t("coverSet"),
										)
									}
								>
									<Star
										className={cn(
											"h-3 w-3",
											isCover && "fill-primary text-primary",
										)}
									/>
								</Button>
								<Button
									type="button"
									size="icon"
									variant="secondary"
									className="h-6 w-6 bg-background/80 backdrop-blur hover:text-destructive"
									aria-label={t("remove")}
									onPointerDown={(event) => event.stopPropagation()}
									onClick={() => {
										setItems((prev) => prev.filter((m) => m.id !== media.id));
										run(
											removeAlbumItem({ albumId: album.id, mediaId: media.id }),
											t("removed"),
										);
									}}
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						</div>
					);
				}}
			/>
			<UrlPagination page={album.page} pageCount={album.pageCount} />
		</div>
	);
}
