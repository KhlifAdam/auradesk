"use client";

import { Heart, LockOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { reopenSelection, shareGallery } from "@/services/galleries/actions";
import type { GalleryFilter, GalleryView } from "@/services/galleries/types";

const FILTERS: GalleryFilter[] = ["all", "selected", "flagged"];

/** Share switch, selection status and the all/picks filter. */
export function GalleryToolbar({ gallery }: { gallery: GalleryView }) {
	const t = useTranslations("Galleries.manager");
	const pathname = usePathname();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const run = (
		action: () => Promise<{ ok: boolean; error?: string }>,
		success: string,
	) =>
		startTransition(async () => {
			const result = await action();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(success);
			router.refresh();
		});

	const limit = gallery.selectionLimit;
	const picks = limit
		? t("picksOf", { count: gallery.selectedCount, limit })
		: t("picks", { count: gallery.selectedCount });

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-2">
					<Switch
						id="gallery-shared"
						checked={gallery.shared}
						disabled={isPending}
						onCheckedChange={(shared) =>
							run(
								() => shareGallery({ id: gallery.id, shared }),
								shared ? t("sharedToast") : t("unsharedToast"),
							)
						}
					/>
					<Label htmlFor="gallery-shared" className="text-xs font-medium">
						{gallery.shared ? t("shared") : t("private")}
					</Label>
				</div>
				{gallery.selectionEnabled && (
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Heart className="h-3.5 w-3.5 text-primary" />
						{picks}
						{gallery.submitted && (
							<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
								{t("submitted")}
							</span>
						)}
					</span>
				)}
				{gallery.submitted && (
					<Button
						size="sm"
						variant="ghost"
						className="h-7 gap-1.5 text-xs"
						disabled={isPending}
						onClick={() =>
							run(() => reopenSelection(gallery.id), t("reopened"))
						}
					>
						<LockOpen className="h-3.5 w-3.5" />
						{t("reopen")}
					</Button>
				)}
			</div>
			<div className="inline-flex rounded-lg border border-border p-0.5">
				{FILTERS.map((filter) => (
					<Link
						key={filter}
						href={filter === "all" ? pathname : `${pathname}?filter=${filter}`}
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
		</div>
	);
}
