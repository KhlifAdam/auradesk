import { putWithProgress } from "@/lib/media/read-media-metadata";
import { startAttachmentUpload } from "@/services/messages/attachment-actions";
import type { SentAttachment } from "@/services/messages/attachments";
import type { MessageRole } from "@/services/messages/viewer";

/** Some systems give no type for documents: guess it from the extension. */
const BY_EXTENSION: Record<string, string> = {
	pdf: "application/pdf",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	ppt: "application/vnd.ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	zip: "application/zip",
	txt: "text/plain",
	csv: "text/csv",
};

function typed(file: Blob, filename: string) {
	if (file.type) return file;
	const extension = filename.split(".").pop()?.toLowerCase() ?? "";
	const type = BY_EXTENSION[extension];
	return type ? new Blob([file], { type }) : file;
}

/** Thrown with an error code the composer can translate. */
export class AttachmentError extends Error {}

/**
 * Sends a file (or a recorded voice message) straight to the private bucket,
 * then returns what goes with the message. The server checks it on send.
 */
export async function uploadAttachment(
	as: MessageRole,
	source: Blob,
	filename: string,
	voice: { durationMs: number } | null,
	onProgress: (percent: number) => void,
): Promise<SentAttachment> {
	const file = typed(source, filename);
	const meta = { filename, mimeType: file.type, size: file.size };
	const started = await startAttachmentUpload({ as, ...meta });
	if (!started.ok) throw new AttachmentError(started.error);
	try {
		await putWithProgress(started.data.uploadUrl, file, onProgress);
	} catch {
		throw new AttachmentError("uploadFailed");
	}
	return {
		...meta,
		key: started.data.key,
		voice: voice !== null,
		durationMs: voice?.durationMs ?? null,
	};
}
