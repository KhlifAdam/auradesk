"use client";

import { useUploadQueue } from "@/hooks/use-upload-queue";
import {
	putWithProgress,
	readMediaMetadata,
} from "@/lib/media/read-media-metadata";
import { resizeForWeb } from "@/lib/media/resize-for-web";
import { withoutLocation } from "@/lib/media/strip-location";
import { confirmUpload, requestUpload } from "@/services/media/actions";
import { MEDIA_LIMITS, mediaKindOf } from "@/services/media/constants";
import type { MediaItem } from "@/services/media/types";

function precheck(file: File): string | undefined {
	const kind = mediaKindOf(file.type);
	if (!kind) return "unsupportedType";
	if (file.size > MEDIA_LIMITS[kind].maxSize) return "tooLarge";
}

/**
 * Presign → direct PUT to R2 → confirm. The bucket is public, so a photo's
 * GPS position is removed first: anyone could read where it was taken. Big
 * photos are brought down to web size, so the site stays fast.
 */
async function uploadMedia(
	original: File,
	onProgress: (percent: number) => void,
): Promise<MediaItem> {
	const file = await resizeForWeb(await withoutLocation(original));
	const fileInfo = {
		filename: file.name,
		mimeType: file.type,
		size: file.size,
	};
	const [meta, presigned] = await Promise.all([
		readMediaMetadata(file),
		requestUpload(fileInfo),
	]);
	if (!presigned.ok) throw new Error(presigned.error);

	await putWithProgress(presigned.data.uploadUrl, file, onProgress);

	const confirmed = await confirmUpload({
		...fileInfo,
		...meta,
		key: presigned.data.key,
	});
	if (!confirmed.ok) throw new Error(confirmed.error);
	return confirmed.data;
}

export function useMediaUpload(onUploaded?: (media: MediaItem) => void) {
	return useUploadQueue({ precheck, upload: uploadMedia, onUploaded });
}
