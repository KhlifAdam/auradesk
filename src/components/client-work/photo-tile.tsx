import { Film, MessageCircle } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { GalleryPhoto } from "@/services/galleries/types";
import { VideoBadge } from "./media-badge";
import { PhotoFlags } from "./photo-flags";

interface PhotoTileProps {
	photo: GalleryPhoto;
	onOpen: () => void;
	openLabel: string;
	/** Controls in the top-right corner. */
	actions?: ReactNode;
	/** Always-visible badge in the top-left corner. */
	badge?: ReactNode;
	onComments?: () => void;
	commentsLabel?: string;
	className?: string;
	/** One of the first tiles, visible at once: load it without waiting. */
	eager?: boolean;
}

/** Square private photo or video (signed URL, so not optimized) with overlay controls. */
export function PhotoTile({
	photo,
	onOpen,
	openLabel,
	actions,
	badge,
	onComments,
	commentsLabel,
	className,
	eager,
}: PhotoTileProps) {
	return (
		<div
			className={cn(
				"group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted",
				className,
			)}
		>
			<button
				type="button"
				onClick={onOpen}
				aria-label={openLabel}
				className="absolute inset-0"
			>
				{photo.previewUrl ? (
					<Image
						src={photo.previewUrl}
						alt={photo.filename}
						fill
						unoptimized
						loading={eager ? "eager" : "lazy"}
						className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
					/>
				) : (
					<span className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-muted-foreground">
						<Film className="h-6 w-6" />
						<span className="w-full truncate text-center text-[11px]">
							{photo.filename}
						</span>
					</span>
				)}
			</button>
			{photo.type === "VIDEO" && <VideoBadge durationSec={photo.durationSec} />}
			<PhotoFlags flags={photo.flags} />
			{badge && (
				<div className="absolute left-1.5 top-1.5 flex gap-1">{badge}</div>
			)}
			{actions && (
				<div className="absolute right-1.5 top-1.5 flex gap-1">{actions}</div>
			)}
			{onComments && (
				<button
					type="button"
					onClick={onComments}
					onPointerDown={(event) => event.stopPropagation()}
					aria-label={commentsLabel}
					className={cn(
						"absolute bottom-1.5 right-1.5 flex h-6 items-center gap-1 rounded-full bg-background/80 px-2 text-[11px] font-medium backdrop-blur transition-opacity duration-200",
						photo.commentCount === 0 &&
							"opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
					)}
				>
					<MessageCircle className="h-3 w-3" />
					{photo.commentCount > 0 && photo.commentCount}
				</button>
			)}
		</div>
	);
}
