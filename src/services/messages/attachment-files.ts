import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
	deletePrivateObjects,
	getPrivateUploadUrl,
	getPrivateViewUrl,
	headPrivateObject,
} from "@/lib/storage/r2-private";
import { attachmentKind, type SentAttachment } from "./attachments";
import type { ChatAttachment } from "./types";

/** Each sender uploads under their own prefix; no one can attach another's file. */
const keyPrefix = (senderId: string) => `messages/${senderId}/`;

/** A short, safe extension from the file name (none if it looks odd). */
function extensionOf(filename: string) {
	const match = /\.([a-z0-9]{1,8})$/i.exec(filename);
	return match ? `.${match[1].toLowerCase()}` : "";
}

/** Where the browser puts the file before the message is sent. */
export async function prepareUpload(
	senderId: string,
	file: { filename: string; mimeType: string; size: number },
) {
	const key = `${keyPrefix(senderId)}${randomUUID()}${extensionOf(file.filename)}`;
	const uploadUrl = await getPrivateUploadUrl(key, file.mimeType, file.size);
	return { key, uploadUrl };
}

/**
 * The row to store with the message, once the file is confirmed in the
 * bucket with the announced size. Null when it is missing or not the sender's.
 */
export async function verifiedAttachment(
	senderId: string,
	attachment: SentAttachment,
): Promise<Omit<Prisma.MessageAttachmentCreateInput, "message"> | null> {
	if (!attachment.key.startsWith(keyPrefix(senderId))) return null;
	const stored = await headPrivateObject(attachment.key);
	if (stored?.size !== attachment.size) return null;
	return {
		key: attachment.key,
		kind: attachmentKind(attachment.mimeType, attachment.voice),
		filename: attachment.filename,
		mimeType: attachment.mimeType,
		size: attachment.size,
		durationMs: attachment.voice ? attachment.durationMs : null,
	};
}

/** Best-effort removal of files whose rows are gone. */
export async function deleteAttachmentFiles(keys: string[]) {
	if (keys.length === 0) return;
	await deletePrivateObjects(keys).catch((error) =>
		console.error("Failed to delete message attachments:", error),
	);
}

/** What the thread shows; the link is signed for the viewer. */
export async function toChatAttachment(row: {
	id: string;
	key: string;
	kind: ChatAttachment["kind"];
	filename: string;
	mimeType: string;
	size: number;
	durationMs: number | null;
}): Promise<ChatAttachment> {
	return {
		id: row.id,
		kind: row.kind,
		filename: row.filename,
		mimeType: row.mimeType,
		size: row.size,
		durationMs: row.durationMs,
		url: await getPrivateViewUrl(row.key),
	};
}
