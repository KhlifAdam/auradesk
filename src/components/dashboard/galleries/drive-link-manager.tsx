"use client";

import { ExternalLink, HardDrive, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ActionResult } from "@/lib/action-result";
import { shareGallery, updateGalleryLink } from "@/services/galleries/actions";
import { driveUrlSchema } from "@/services/galleries/schemas";
import type { GalleryView } from "@/services/galleries/types";

/** A Google Drive delivery: the link, whether the client sees it, and a way to change it. */
export function DriveLinkManager({ gallery }: { gallery: GalleryView }) {
	const t = useTranslations("Galleries.drive");
	const tManager = useTranslations("Galleries.manager");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();
	const [url, setUrl] = useState(gallery.externalUrl ?? "");
	const valid = driveUrlSchema.safeParse(url).success;
	const changed = url.trim() !== (gallery.externalUrl ?? "");

	const run = (task: () => Promise<ActionResult>, done: string) =>
		startTransition(async () => {
			const result = await task();
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(done);
			router.refresh();
		});

	return (
		<section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-drive/20 via-success/15 to-warning/20 text-drive">
						<HardDrive className="h-5 w-5" />
					</span>
					<div className="flex flex-col">
						<span className="text-sm font-semibold">{t("title")}</span>
						<span className="text-xs text-muted-foreground">{t("hint")}</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						id="drive-shared"
						checked={gallery.shared}
						disabled={pending}
						onCheckedChange={(shared) =>
							run(
								() => shareGallery({ id: gallery.id, shared }),
								shared ? tManager("sharedToast") : tManager("unsharedToast"),
							)
						}
					/>
					<Label htmlFor="drive-shared" className="text-xs font-medium">
						{gallery.shared ? tManager("shared") : tManager("private")}
					</Label>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="drive-url" className="text-xs">
					{t("url")}
				</Label>
				<div className="flex flex-wrap gap-2">
					<Input
						id="drive-url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className="h-8 min-w-60 flex-1 text-xs"
						aria-invalid={!valid}
					/>
					<Button
						size="sm"
						className="h-8 gap-1.5 text-xs"
						disabled={pending || !valid || !changed}
						onClick={() =>
							run(
								() => updateGalleryLink({ id: gallery.id, externalUrl: url }),
								t("saved"),
							)
						}
					>
						{pending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Save className="h-3.5 w-3.5" />
						)}
						{t("save")}
					</Button>
					{gallery.externalUrl && (
						<Button
							asChild
							size="sm"
							variant="outline"
							className="h-8 gap-1.5 text-xs"
						>
							<a
								href={gallery.externalUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="h-3.5 w-3.5" />
								{t("open")}
							</a>
						</Button>
					)}
				</div>
				{!valid && (
					<p className="text-[11px] text-destructive">{t("invalid")}</p>
				)}
			</div>
			<p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
				{t("access")}
			</p>
		</section>
	);
}
