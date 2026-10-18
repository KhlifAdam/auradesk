"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { MediaDropzone } from "@/components/dashboard/media/media-dropzone";
import { UploadQueue } from "@/components/dashboard/media/upload-queue";
import {
	GALLERY_IMAGE_TYPES,
	GALLERY_MIME_TYPES,
} from "@/services/galleries/constants";
import type { GalleryKind } from "@/services/galleries/types";
import { useGalleryUpload } from "./use-gallery-upload";

export function GalleryUploader({
	galleryId,
	kind,
}: {
	galleryId: string;
	kind: GalleryKind;
}) {
	const t = useTranslations("Galleries.manager");
	const router = useRouter();
	const refresh = useCallback(() => router.refresh(), [router]);
	const { tasks, addFiles, retry, cancel, clearFinished } = useGalleryUpload(
		galleryId,
		refresh,
		kind,
	);

	return (
		<div className="flex flex-col gap-3">
			<MediaDropzone
				onFiles={addFiles}
				accept={kind === "PROOFS" ? GALLERY_IMAGE_TYPES : GALLERY_MIME_TYPES}
				hint={t(kind === "PROOFS" ? "dropHintProofs" : "dropHint")}
			/>
			<UploadQueue
				tasks={tasks}
				onRetry={retry}
				onCancel={cancel}
				onClear={clearFinished}
			/>
		</div>
	);
}
