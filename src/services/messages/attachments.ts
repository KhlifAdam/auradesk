import { z } from "zod";

/** Files sent in a conversation: photos, documents, short videos. */
export const ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
/** Voice messages stop recording on their own after this long. */
export const VOICE_MAX_MS = 5 * 60 * 1000;

export type AttachmentKindValue = "IMAGE" | "VOICE" | "FILE";

const DOCUMENT_TYPES = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/zip",
	"application/x-zip-compressed",
	"text/plain",
	"text/csv",
]);

/** What the composer's file picker offers. */
export const ATTACHMENT_ACCEPT = [
	"image/*",
	"video/*",
	"audio/*",
	...DOCUMENT_TYPES,
].join(",");

/** Base type without parameters: `audio/webm;codecs=opus` → `audio/webm`. */
export const baseMime = (mimeType: string) =>
	mimeType.split(";")[0].trim().toLowerCase();

export function isAllowedMime(mimeType: string) {
	const mime = baseMime(mimeType);
	return (
		/^(image|video|audio)\/[\w.+-]+$/.test(mime) || DOCUMENT_TYPES.has(mime)
	);
}

/** Images show inline (SVG never: it can carry scripts). */
export function attachmentKind(
	mimeType: string,
	voice: boolean,
): AttachmentKindValue {
	if (voice) return "VOICE";
	const mime = baseMime(mimeType);
	return mime.startsWith("image/") && mime !== "image/svg+xml"
		? "IMAGE"
		: "FILE";
}

export const attachmentFileSchema = z.object({
	filename: z.string().trim().min(1).max(200),
	mimeType: z.string().max(120).refine(isAllowedMime, "unsupportedType"),
	size: z.number().int().positive().max(ATTACHMENT_MAX_BYTES, "tooLarge"),
});

/** What the composer sends along with the text, once the file is uploaded. */
export const sentAttachmentSchema = attachmentFileSchema.extend({
	key: z.string().min(1).max(300),
	voice: z.boolean(),
	durationMs: z
		.number()
		.int()
		.positive()
		.max(VOICE_MAX_MS + 5000)
		.nullable(),
});

export type SentAttachment = z.infer<typeof sentAttachmentSchema>;

/** "1:05" */
export function formatDuration(ms: number) {
	const seconds = Math.max(0, Math.round(ms / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "2.4 MB" */
export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shown in the conversation list and notices; language-free on purpose. */
export function attachmentPreview(
	kind: AttachmentKindValue,
	filename: string,
	durationMs: number | null,
) {
	if (kind === "VOICE") return `🎤 ${formatDuration(durationMs ?? 0)}`;
	return `${kind === "IMAGE" ? "📷" : "📎"} ${filename}`;
}
