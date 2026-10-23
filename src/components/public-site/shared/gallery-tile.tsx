import { Expand, Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { SiteMedia } from "@/services/public-site/types";
import { orientationOf } from "./photo-layout";

interface GalleryTileProps {
	media: SiteMedia;
	onClick: () => void;
	/**
	 * square: fixed 1:1 tile · natural: keeps the photo's ratio (masonry) ·
	 * fill: stretches to its grid cell (bento layouts).
	 */
	shape?: "square" | "natural" | "fill";
	sizes: string;
	caption?: string;
	className?: string;
}

/** One clickable photo/video in a portfolio, with a hover overlay. */
export function GalleryTile({
	media,
	onClick,
	shape = "square",
	sizes,
	caption,
	className,
}: GalleryTileProps) {
	const style: CSSProperties | undefined =
		shape === "natural"
			? { aspectRatio: `${media.width} / ${media.height}` }
			: undefined;

	return (
		<button
			type="button"
			onClick={onClick}
			style={style}
			aria-label={caption || media.alt}
			className={cn(
				"group relative block w-full overflow-hidden bg-[var(--s-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-accent)]",
				shape === "square" && "aspect-square",
				shape === "fill" && "h-full",
				className,
			)}
		>
			{media.type === "IMAGE" ? (
				<Image
					src={media.url}
					alt={media.alt}
					fill
					sizes={sizes}
					className={cn(
						"object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]",
						// A cropped portrait keeps its upper part, where faces usually are.
						orientationOf(media) === "portrait" && "object-[50%_30%]",
					)}
				/>
			) : (
				<video
					src={`${media.url}#t=0.1`}
					preload="metadata"
					muted
					playsInline
					className="h-full w-full object-cover"
				/>
			)}
			<span className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-4 text-left text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
				<span className="text-sm font-medium">{caption}</span>
				{media.type === "VIDEO" ? (
					<Play className="h-4 w-4 shrink-0 fill-current" />
				) : (
					<Expand className="h-4 w-4 shrink-0" />
				)}
			</span>
			{media.type === "VIDEO" && (
				<span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white group-hover:opacity-0">
					<Play className="h-3.5 w-3.5 fill-current" />
				</span>
			)}
		</button>
	);
}
