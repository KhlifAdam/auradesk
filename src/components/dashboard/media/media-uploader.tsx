"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useMediaUpload } from "@/components/dashboard/media/use-media-upload";
import { MediaDropzone } from "./media-dropzone";
import { UploadTiles } from "./upload-tiles";

/** Library uploader: refreshes the server-rendered grid as files land. */
export function MediaUploader() {
	const router = useRouter();
	const [refreshing, startRefresh] = useTransition();
	const { tasks, addFiles, retry, cancel, clearFinished, isUploading } =
		useMediaUpload(() => startRefresh(() => router.refresh()));

	// Once the grid below shows the landed files, drop their tiles.
	useEffect(() => {
		if (!isUploading && !refreshing) clearFinished();
	}, [isUploading, refreshing, clearFinished]);

	return (
		<div className="flex flex-col gap-4">
			<MediaDropzone onFiles={addFiles} />
			<UploadTiles
				tasks={tasks}
				onRetry={retry}
				onClear={clearFinished}
				onCancel={cancel}
			/>
		</div>
	);
}
