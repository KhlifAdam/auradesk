"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CommentsSheet } from "@/components/client-work/comments-sheet";
import { PhotoLightbox } from "@/components/client-work/photo-lightbox";
import { PhotoTile } from "@/components/client-work/photo-tile";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { cn } from "@/lib/utils";
import type {
	GalleryFilter,
	GalleryPhoto,
	GalleryView,
} from "@/services/galleries/types";
import { SelectionBar } from "./selection-bar";
import { useSelection } from "./use-selection";

const FILTERS = ["all", "selected"] as const satisfies GalleryFilter[];

/** Client's view of a shared gallery: browse, pick favourites, comment. */
export function PortalGallery({ gallery }: { gallery: GalleryView }) {
	const t = useTranslations("Portal.gallery");
	const pathname = usePathname();
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const [commentsFor, setCommentsFor] = useState<GalleryPhoto | null>(null);
	const { items, selectedCount, toggle } = useSelection(
		gallery.items,
		gallery.selectedCount,
	);
	const canSelect = gallery.selectionEnabled && !gallery.submitted;

	const heart = (photo: GalleryPhoto, large?: boolean) => (
		<button
			type="button"
			onClick={() => toggle(photo)}
			disabled={!canSelect}
			aria-pressed={photo.selected}
			aria-label={photo.selected ? t("unselect") : t("select")}
			className={cn(
				"flex items-center justify-center rounded-full transition-all duration-200 disabled:cursor-default",
				large ? "h-9 w-9" : "h-7 w-7",
				photo.selected
					? "bg-primary text-primary-foreground shadow"
					: "bg-background/80 text-foreground backdrop-blur hover:scale-105",
				!photo.selected && !canSelect && "hidden",
			)}
		>
			<Heart
				className={cn(
					large ? "h-4 w-4" : "h-3.5 w-3.5",
					photo.selected && "fill-current",
				)}
			/>
		</button>
	);

	return (
		<div className="flex flex-col gap-4">
			{gallery.selectionEnabled && (
				<div className="inline-flex w-fit rounded-lg border border-border bg-card p-0.5">
					{FILTERS.map((filter) => (
						<Link
							key={filter}
							href={
								filter === "all" ? pathname : `${pathname}?filter=${filter}`
							}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
								filter === gallery.filter
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{t(`filters.${filter}`)}
						</Link>
					))}
				</div>
			)}
			{items.length === 0 ? (
				<p className="py-12 text-center text-sm text-muted-foreground">
					{gallery.filter === "selected" ? t("noPicks") : t("empty")}
				</p>
			) : (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{items.map((photo, index) => (
						<PhotoTile
							key={photo.id}
							photo={photo}
							openLabel={t("open", { name: photo.filename })}
							onOpen={() => setOpenIndex(index)}
							onComments={() => setCommentsFor(photo)}
							commentsLabel={t("comments")}
							actions={heart(photo)}
						/>
					))}
				</div>
			)}
			<UrlPagination page={gallery.page} pageCount={gallery.pageCount} />
			{gallery.selectionEnabled && (
				<SelectionBar
					galleryId={gallery.id}
					selectedCount={selectedCount}
					limit={gallery.selectionLimit}
					submitted={gallery.submitted}
				/>
			)}
			<PhotoLightbox
				items={items}
				index={openIndex}
				onIndexChange={setOpenIndex}
				renderActions={(photo) => heart(photo, true)}
				originals={gallery.originals}
			/>
			<CommentsSheet photo={commentsFor} onClose={() => setCommentsFor(null)} />
		</div>
	);
}
