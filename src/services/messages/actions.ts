"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendNewMessageEmail } from "@/lib/mail/send-client-notices";
import { realEmail } from "@/lib/phone";
import { sendNewMessageSms } from "@/lib/sms/send-client-sms";
import { searchClients } from "@/services/clients/queries";
import { deleteAttachmentFiles, verifiedAttachment } from "./attachment-files";
import { attachmentPreview } from "./attachments";
import { CLIENT_SEARCH_LIMIT, PREVIEW_LENGTH } from "./constants";
import { canConverse, toChatMessage } from "./queries";
import { resolveViewer } from "./resolve-viewer";
import {
	deleteMessageSchema,
	editMessageSchema,
	markReadSchema,
	searchClientsSchema,
	sendMessageSchema,
} from "./schemas";
import type { ChatMessage } from "./types";
import {
	otherRole,
	ownConversations,
	pairWith,
	typingField,
	unreadField,
	type Viewer,
} from "./viewer";

/** The conversation to write in; a first message creates it, if the pair may talk. */
async function resolveConversation(
	viewer: Viewer,
	conversationId: string | null,
	partnerId: string | null,
) {
	if (conversationId) {
		const own = await db.conversation.findFirst({
			where: { id: conversationId, ...ownConversations(viewer) },
			select: { id: true },
		});
		return own?.id ?? null;
	}
	if (!partnerId) return null;
	const pair = pairWith(viewer, partnerId);
	const existing = await db.conversation.findUnique({
		where: { photographerId_clientId: pair },
		select: { id: true },
	});
	if (existing) return existing.id;
	if (!(await canConverse(pair.photographerId, pair.clientId))) return null;
	const created = await db.conversation.upsert({
		where: { photographerId_clientId: pair },
		create: pair,
		update: {},
		select: { id: true },
	});
	return created.id;
}

const previewOf = (body: string) =>
	body.replace(/\s+/g, " ").slice(0, PREVIEW_LENGTH);

export async function sendMessage(
	input: unknown,
): Promise<ActionResult<{ conversationId: string; message: ChatMessage }>> {
	const parsed = sendMessageSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { as, conversationId, partnerId, body, attachment } = parsed.data;
	const viewer = await resolveViewer(as);

	const file = attachment && (await verifiedAttachment(viewer.id, attachment));
	if (attachment && !file) return fail("uploadMissing");
	const id = await resolveConversation(viewer, conversationId, partnerId);
	if (!id) return fail("notFound");
	const preview = previewOf(
		body ||
			(file
				? attachmentPreview(file.kind, file.filename, file.durationMs ?? null)
				: ""),
	);

	const { message, conversation } = await db.$transaction(async (tx) => {
		const created = await tx.message.create({
			data: {
				conversationId: id,
				senderId: viewer.id,
				body,
				...(file && { attachment: { create: file } }),
			},
			include: { attachment: true },
		});
		// Writing means the sender has read everything so far.
		const updated = await tx.conversation.update({
			where: { id },
			data: {
				lastMessageAt: created.createdAt,
				lastMessagePreview: preview,
				lastSenderId: viewer.id,
				[unreadField(otherRole(as))]: { increment: 1 },
				[unreadField(as)]: 0,
				// Sending ends "is typing".
				[typingField(as)]: null,
			},
			select: {
				photographerUnread: true,
				clientUnread: true,
				photographer: {
					select: {
						name: true,
						email: true,
						phoneNumber: true,
						locale: true,
						studio: { select: { name: true } },
					},
				},
				client: {
					select: { name: true, email: true, phoneNumber: true, locale: true },
				},
			},
		});
		return { message: created, conversation: updated };
	});

	// Only the first unread message emails, so a burst doesn't flood the inbox.
	const recipient = as === "photographer" ? "client" : "photographer";
	if (conversation[unreadField(recipient)] === 1) {
		const sender =
			as === "photographer"
				? (conversation.photographer.studio?.name ??
					conversation.photographer.name)
				: conversation.client.name;
		const to = conversation[recipient];
		const path =
			recipient === "client"
				? `/portal/messages?c=${id}`
				: `/dashboard/messages?c=${id}`;
		const locale = resolveMailLocale(to.locale);
		// Phone-only recipients have no real email: text them instead.
		const notice = realEmail(to.email)
			? sendNewMessageEmail({
					to: to.email,
					locale,
					sender,
					preview,
					path,
				})
			: to.phoneNumber
				? sendNewMessageSms({ to: to.phoneNumber, locale, sender, path })
				: Promise.resolve();
		notice.catch((error) =>
			console.error("Failed to notify of a new message:", error),
		);
	}

	return ok({ conversationId: id, message: await toChatMessage(message) });
}

/** The viewer's own, not yet deleted message, with what its conversation shows. */
function findOwnMessage(viewer: Viewer, messageId: string) {
	return db.message.findFirst({
		where: {
			id: messageId,
			senderId: viewer.id,
			deletedAt: null,
			conversation: ownConversations(viewer),
		},
		select: {
			id: true,
			createdAt: true,
			conversationId: true,
			attachment: { select: { kind: true, key: true } },
			conversation: { select: { lastMessageAt: true, lastSenderId: true } },
		},
	});
}

/** Keeps the conversation list in step when the latest message changes. */
async function syncPreview(
	message: NonNullable<Awaited<ReturnType<typeof findOwnMessage>>>,
	viewer: Viewer,
	preview: string,
) {
	const { lastMessageAt, lastSenderId } = message.conversation;
	if (lastSenderId !== viewer.id) return;
	if (lastMessageAt?.getTime() !== message.createdAt.getTime()) return;
	await db.conversation.update({
		where: { id: message.conversationId },
		data: { lastMessagePreview: preview },
	});
}

/** Changes the text of one of the viewer's own messages. */
export async function editMessage(input: unknown): Promise<ActionResult> {
	const parsed = editMessageSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { as, messageId, body } = parsed.data;
	const viewer = await resolveViewer(as);

	const message = await findOwnMessage(viewer, messageId);
	if (!message) return fail("notFound");
	// A voice message has no text to change.
	if (message.attachment?.kind === "VOICE") return fail("invalidInput");
	await db.message.update({
		where: { id: message.id },
		data: { body, editedAt: new Date() },
	});
	await syncPreview(message, viewer, previewOf(body));
	return ok();
}

/** Deletes one of the viewer's own messages; the thread shows it as removed. */
export async function deleteMessage(input: unknown): Promise<ActionResult> {
	const parsed = deleteMessageSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const viewer = await resolveViewer(parsed.data.as);

	const message = await findOwnMessage(viewer, parsed.data.messageId);
	if (!message) return fail("notFound");
	await db.message.update({
		where: { id: message.id },
		data: {
			body: "",
			deletedAt: new Date(),
			// The file goes with it, from the bucket too.
			...(message.attachment && { attachment: { delete: true } }),
		},
	});
	if (message.attachment) await deleteAttachmentFiles([message.attachment.key]);
	// An empty preview is shown as "message deleted".
	await syncPreview(message, viewer, "");
	return ok();
}

/** Tells the other side that the viewer is typing in a conversation. */
export async function setTyping(input: unknown): Promise<ActionResult> {
	const parsed = markReadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const viewer = await resolveViewer(parsed.data.as);

	await db.conversation.updateMany({
		where: { id: parsed.data.conversationId, ...ownConversations(viewer) },
		data: { [typingField(viewer.role)]: new Date() },
	});
	return ok();
}

/** Clears the viewer's unread count for a conversation they have open. */
export async function markConversationRead(
	input: unknown,
): Promise<ActionResult> {
	const parsed = markReadSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const viewer = await resolveViewer(parsed.data.as);

	await db.conversation.updateMany({
		where: { id: parsed.data.conversationId, ...ownConversations(viewer) },
		data: { [unreadField(viewer.role)]: 0 },
	});
	return ok();
}

/** Photographer picks a client to write to. */
export async function findClientsToMessage(
	input: unknown,
): Promise<
	ActionResult<
		{ id: string; name: string; email: string; image: string | null }[]
	>
> {
	const { photographerId } = await requirePhotographer();
	const parsed = searchClientsSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	return ok(
		await searchClients(photographerId, parsed.data, CLIENT_SEARCH_LIMIT),
	);
}
