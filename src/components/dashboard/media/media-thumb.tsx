import { Play } from "lucide-react";
import Image from "next/image";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/services/media/types";

interface MediaThumbProps {
	media: MediaItem;
	sizes?: string;
	className?: string;
	/** One of the first thumbnails, visible at once: load it without waiting. */
	eager?: boolean;
}

/** Square preview for an image or video (first frame + duration badge). */
export function MediaThumb({
	media,
	sizes = "(min-width: 1280px) 12vw, (min-width: 768px) 20vw, 33vw",
	className,
	eager,
}: MediaThumbProps) {
	return (
		<div
			className={cn(
				"relative aspect-square w-full overflow-hidden bg-muted",
				className,
			)}
		>
			{media.type === "IMAGE" ? (
				<Image
					src={media.url}
					alt={media.alt ?? media.filename}
					fill
					sizes={sizes}
					loading={eager ? "eager" : "lazy"}
					className="object-cover"
				/>
			) : (
				<>
					<video
						src={`${media.url}#t=0.1`}
						preload="metadata"
						muted
						playsInline
						className="h-full w-full object-cover"
					/>
					<span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
						<Play className="h-3 w-3 fill-current" />
						{media.durationSec != null && formatDuration(media.durationSec)}
					</span>
				</>
			)}
		</div>
	);
}
