"use client";

import { Copy, Crosshair } from "lucide-react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { formatBytes, formatDuration } from "@/lib/format";
import type { MediaItem } from "@/services/media/types";
import { MediaAltForm } from "./media-alt-form";
import { MediaDeleteButton } from "./media-delete-button";
import { MediaFocusDialog } from "./media-focus-dialog";

interface MediaDetailSheetProps {
	media: MediaItem | null;
	onOpenChange: (open: boolean) => void;
}

export function MediaDetailSheet({
	media,
	onOpenChange,
}: MediaDetailSheetProps) {
	const t = useTranslations("Media.detail");
	const locale = useLocale();
	const format = useFormatter();
	const [framing, setFraming] = useState(false);

	const copyUrl = async (url: string) => {
		await navigator.clipboard.writeText(url);
		toast.success(t("copied"));
	};

	return (
		<Sheet open={media !== null} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
				{media && (
					<>
						<SheetHeader>
							<SheetTitle className="truncate pr-6">
								{media.filename}
							</SheetTitle>
							<SheetDescription>
								{format.dateTime(new Date(media.createdAt), {
									dateStyle: "long",
								})}
							</SheetDescription>
						</SheetHeader>

						<div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
							{media.type === "IMAGE" ? (
								<Image
									src={media.url}
									alt={media.alt ?? media.filename}
									fill
									sizes="448px"
									className="object-contain"
								/>
							) : (
								// biome-ignore lint/a11y/useMediaCaption: user-uploaded footage has no captions
								<video
									src={media.url}
									controls
									preload="metadata"
									className="h-full w-full"
								/>
							)}
						</div>

						{media.type === "IMAGE" && (
							<>
								<Button
									variant="outline"
									size="sm"
									className="w-fit gap-2"
									onClick={() => setFraming(true)}
								>
									<Crosshair className="h-4 w-4" />
									{t("adjust")}
								</Button>
								<MediaFocusDialog
									media={media}
									open={framing}
									onOpenChange={setFraming}
								/>
							</>
						)}

						<dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
							<Info label={t("size")} value={formatBytes(media.size, locale)} />
							<Info label={t("type")} value={media.mimeType} />
							{media.width && media.height && (
								<Info
									label={t("dimensions")}
									value={`${media.width} × ${media.height}`}
								/>
							)}
							{media.durationSec != null && (
								<Info
									label={t("duration")}
									value={formatDuration(media.durationSec)}
								/>
							)}
						</dl>

						<MediaAltForm media={media} />

						<div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
							<Button
								variant="ghost"
								size="sm"
								className="gap-2"
								onClick={() => copyUrl(media.url)}
							>
								<Copy className="h-4 w-4" />
								{t("copyLink")}
							</Button>
							<MediaDeleteButton
								mediaId={media.id}
								onDeleted={() => onOpenChange(false)}
							/>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function Info({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="truncate font-medium">{value}</dd>
		</div>
	);
}
