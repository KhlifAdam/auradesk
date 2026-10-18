import { Heart, ImageIcon, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GallerySummary } from "@/services/galleries/types";
import { GalleryCover } from "./gallery-cover";

/**
 * Gallery tile, showing the gallery's cover small, in its chosen layout (the
 * same renderer as the gallery page). Covers are private URLs, so they skip
 * the optimizer.
 */
export function GalleryCard({
	gallery,
	href,
	showShareState,
}: {
	gallery: GallerySummary;
	href: string;
	showShareState?: boolean;
}) {
	const t = useTranslations("Galleries.card");
	const styled =
		gallery.cover.template !== "NONE" && Boolean(gallery.cover.imageUrl);

	return (
		<Link
			href={href}
			className="group flex flex-col self-start overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-luminous-lg"
		>
			<div className={cn("relative bg-muted", !styled && "aspect-[4/3]")}>
				{styled ? (
					// Flush with the card: no rounded corners or border of its own.
					<div className="pointer-events-none [&>section]:rounded-none [&>section]:border-0">
						<GalleryCover
							preview
							cover={gallery.cover}
							title={gallery.title}
							studioName={null}
						/>
					</div>
				) : gallery.coverUrl ? (
					<Image
						src={gallery.coverUrl}
						alt={gallery.title}
						fill
						unoptimized
						className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
					/>
				) : (
					<ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
				)}
				<div className="absolute left-2 top-2 flex gap-1">
					<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
						{t(gallery.kind === "PROOFS" ? "proofs" : "final")}
					</Badge>
					{showShareState && !gallery.shared && (
						<Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
							<Lock className="h-3 w-3" />
							{t("private")}
						</Badge>
					)}
					{gallery.submitted && (
						<Badge className="h-5 px-1.5 text-[10px]">{t("submitted")}</Badge>
					)}
				</div>
			</div>
			<div
				className={cn(
					"flex items-center gap-2 px-3 py-2",
					styled ? "justify-end" : "justify-between",
				)}
			>
				{/* A styled cover already carries the title. */}
				{!styled && (
					<p className="truncate text-sm font-medium">{gallery.title}</p>
				)}
				<div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
					<span>{t("photos", { count: gallery.itemCount })}</span>
					{gallery.selectedCount > 0 && (
						<span className="flex items-center gap-0.5 text-primary">
							<Heart className="h-3 w-3 fill-current" />
							{gallery.selectedCount}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}
