"use client";

import { ArrowUpRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createContext, useContext, useState, useTransition } from "react";
import { toast } from "sonner";
import { MediaThumb } from "@/components/dashboard/media/media-thumb";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import { setAlbumPublished } from "@/services/portfolio/actions";
import type { AlbumSummary } from "@/services/portfolio/types";

/** Every album, provided by the sections editor. */
export const SectionAlbumsContext = createContext<AlbumSummary[]>([]);

/**
 * Picks the albums the site's portfolio shows. Each switch is the album's
 * "published" setting, saved right away (not with the sections form).
 */
export function AlbumPicker() {
	const t = useTranslations("Site.sections.albums");
	const albums = useContext(SectionAlbumsContext);
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();
	// Switches move at once; the server confirms in the background.
	const [shown, setShown] = useState(
		() => new Map(albums.map((album) => [album.id, album.published])),
	);

	const toggle = (id: string, published: boolean) => {
		setShown((current) => new Map(current).set(id, published));
		startTransition(async () => {
			const result = await setAlbumPublished({ id, published });
			if (!result.ok) {
				setShown((current) => new Map(current).set(id, !published));
				return void toast.error(errorMessage(result.error));
			}
			router.refresh();
		});
	};

	if (albums.length === 0)
		return (
			<p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
				{t("none")}{" "}
				<Link href="/dashboard/portfolio" className="text-primary underline">
					{t("create")}
				</Link>
			</p>
		);

	const count = [...shown.values()].filter(Boolean).length;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-baseline justify-between gap-2">
				<p className="text-xs font-medium">
					{t("label")}{" "}
					<span className="text-muted-foreground">
						{t("count", { count, total: albums.length })}
					</span>
				</p>
				<Link
					href="/dashboard/portfolio"
					className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
				>
					{t("manage")}
					<ArrowUpRight className="h-3 w-3" />
				</Link>
			</div>
			<ul className="grid gap-1.5 sm:grid-cols-2">
				{albums.map((album) => {
					const empty = album.itemCount === 0;
					return (
						<li key={album.id}>
							<label
								htmlFor={`site-album-${album.id}`}
								className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-1.5 transition-colors duration-200 hover:bg-muted/50"
							>
								{album.cover ? (
									<MediaThumb
										media={album.cover}
										sizes="48px"
										className="h-10 w-12 shrink-0 rounded-md"
									/>
								) : (
									<span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
										<FolderOpen className="h-4 w-4 text-muted-foreground" />
									</span>
								)}
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate text-xs font-medium">
										{album.title}
									</span>
									<span className="text-[11px] text-muted-foreground">
										{empty
											? t("empty")
											: t("photos", { count: album.itemCount })}
									</span>
								</span>
								<Switch
									id={`site-album-${album.id}`}
									checked={shown.get(album.id) ?? false}
									disabled={isPending || empty}
									onCheckedChange={(checked) => toggle(album.id, checked)}
									aria-label={t("toggle", { title: album.title })}
								/>
							</label>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
