"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { MediaDropzone } from "@/components/dashboard/media/media-dropzone";
import { UploadTiles } from "@/components/dashboard/media/upload-tiles";
import { useMediaUpload } from "@/components/dashboard/media/use-media-upload";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { addAlbumItems } from "@/services/portfolio/item-actions";

/**
 * Drop photos straight into an album: each file is saved to the media
 * library (where it can be reused) and added to the album as it lands.
 */
export function AlbumUploader({
	albumId,
	empty,
}: {
	albumId: string;
	/** An empty album gets a large drop area in place of an empty grid. */
	empty: boolean;
}) {
	const t = useTranslations("Portfolio.album");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	// Adds run one after another, in the order the files finish.
	const adds = useRef(Promise.resolve());
	const added = useRef(0);
	const [refreshing, startRefresh] = useTransition();

	const { tasks, addFiles, retry, cancel, clearFinished, isUploading } =
		useMediaUpload((media) => {
			adds.current = adds.current.then(async () => {
				const result = await addAlbumItems({ albumId, mediaIds: [media.id] });
				if (result.ok) added.current++;
				else toast.error(errorMessage(result.error));
			});
		});

	// One refresh and one message once the whole batch is in.
	useEffect(() => {
		if (isUploading) return;
		void adds.current.then(() => {
			if (added.current === 0) return;
			toast.success(t("added", { count: added.current }));
			added.current = 0;
			startRefresh(() => router.refresh());
		});
	}, [isUploading, router, t]);

	// Once the album shows them, the finished tiles give way to its photos.
	useEffect(() => {
		if (!isUploading && !refreshing) clearFinished();
	}, [isUploading, refreshing, clearFinished]);

	return (
		<div className="flex flex-col gap-3">
			<MediaDropzone
				onFiles={addFiles}
				hint={t("uploadHint")}
				className={cn(
					empty && tasks.length === 0 && "flex-col py-14 text-center",
				)}
			/>
			<UploadTiles
				tasks={tasks}
				onRetry={retry}
				onClear={clearFinished}
				onCancel={cancel}
			/>
		</div>
	);
}
