import { JPEG_HEAD_BYTES, readJpegCapture } from "@/lib/media/jpeg-metadata";
import { makeImagePreview } from "@/lib/media/make-preview";
import { putWithProgress } from "@/lib/media/read-media-metadata";
import { PREVIEW_MAX_EDGE } from "@/services/galleries/constants";
import {
	completeProofUpload,
	startProofUpload,
} from "@/services/galleries/proof-upload-actions";

/** Date and camera from the original, read before it is shrunk away. */
async function captureOf(file: File) {
	if (file.type !== "image/jpeg") return { capturedAt: null, camera: null };
	const head = await file.slice(0, JPEG_HEAD_BYTES).arrayBuffer();
	return readJpegCapture(new Uint8Array(head));
}

/**
 * One photo into a proofs gallery: the browser shrinks it and only that copy
 * is sent. The original stays on disk; its name, size and date go along so
 * it can be collected again once chosen.
 */
export async function uploadProof(
	galleryId: string,
	file: File,
	onProgress: (percent: number) => void,
) {
	const [preview, capture] = await Promise.all([
		makeImagePreview(file, PREVIEW_MAX_EDGE),
		captureOf(file),
	]);
	const fields = {
		galleryId,
		filename: file.name,
		originalSize: file.size,
		originalModifiedAt: file.lastModified,
		proofSize: preview.blob.size,
	};

	const started = await startProofUpload({ ...fields, mimeType: file.type });
	if (!started.ok) throw new Error(started.error);
	// Already in the gallery: nothing to send.
	if (!started.data) return onProgress(100);

	await putWithProgress(started.data.uploadUrl, preview.blob, onProgress);
	const completed = await completeProofUpload({
		...fields,
		key: started.data.key,
		width: preview.width,
		height: preview.height,
		capturedAt: capture.capturedAt?.toISOString() ?? null,
		camera: capture.camera,
	});
	if (!completed.ok) throw new Error(completed.error);
}
