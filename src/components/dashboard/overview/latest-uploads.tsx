import { ImageOff } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MediaThumb } from "@/components/dashboard/media/media-thumb";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/services/media/types";

export function LatestUploads({ items }: { items: MediaItem[] }) {
	const t = useTranslations("Dashboard.Overview.latest");

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<header className="flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				{items.length > 0 && (
					<Link
						href="/dashboard/portfolio/files"
						className="text-xs text-muted-foreground transition-colors hover:text-primary"
					>
						{t("viewAll")}
					</Link>
				)}
			</header>
			{items.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-6 text-center">
					<ImageOff className="h-5 w-5 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">{t("empty")}</p>
					<Button asChild size="sm" className="h-7 text-xs">
						<Link href="/dashboard/portfolio/files">{t("upload")}</Link>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
					{items.map((media) => (
						<Link
							key={media.id}
							href="/dashboard/portfolio/files"
							className="overflow-hidden rounded-lg border border-border transition-colors hover:border-primary/60"
						>
							<MediaThumb media={media} sizes="12vw" />
						</Link>
					))}
				</div>
			)}
		</section>
	);
}
