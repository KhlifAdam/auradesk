"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { MediaDropzone } from "@/components/dashboard/media/media-dropzone";
import { UploadQueue } from "@/components/dashboard/media/upload-queue";
import { useMediaUpload } from "@/components/dashboard/media/use-media-upload";
import { useErrorMessage } from "@/hooks/use-error-message";
import { addAlbumItems } from "@/services/portfolio/item-actions";

/**
 * Drop photos straight into an album: each file is saved to the media
 * library (where it can be reused) and added to the album as it lands.
 */
export function AlbumUploader({ albumId }: { albumId: string }) {
	const t = useTranslations("Portfolio.album");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	// Adds run one after another, in the order the files finish.
	const adds = useRef(Promise.resolve());
	const added = useRef(0);

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
			router.refresh();
		});
	}, [isUploading, router, t]);

	return (
		<div className="flex flex-col gap-3">
			<MediaDropzone onFiles={addFiles} hint={t("uploadHint")} />
			<UploadQueue
				tasks={tasks}
				onRetry={retry}
				onClear={clearFinished}
				onCancel={cancel}
			/>
		</div>
	);
}
