import type { PageMeta } from "@/services/shared/pagination";
import type { AttachmentKindValue } from "./attachments";

/** The other side of a conversation. */
export interface Partner {
	id: string;
	name: string;
	image: string | null;
	/** Studio name, when the partner is a photographer. */
	studioName: string | null;
	/** Their public site's slug, when it is published. */
	siteSlug: string | null;
}

/** A file or voice message; `url` is a short-lived signed link. */
export interface ChatAttachment {
	id: string;
	kind: AttachmentKindValue;
	filename: string;
	mimeType: string;
	size: number;
	durationMs: number | null;
	url: string;
}

export interface ChatMessage {
	id: string;
	senderId: string;
	/** Empty once deleted, or when only a file was sent. */
	body: string;
	createdAt: string;
	editedAt: string | null;
	deleted: boolean;
	/** Null once deleted. */
	attachment: ChatAttachment | null;
}

export interface MessagePage {
	/** Oldest first. */
	messages: ChatMessage[];
	hasMore: boolean;
}

/** What the poll returns: the latest messages and whether the partner is typing. */
export interface LivePage extends MessagePage {
	typing: boolean;
}

export interface ConversationSummary {
	id: string;
	partner: Partner;
	lastMessageAt: string | null;
	preview: string;
	lastFromMe: boolean;
	unread: number;
}

export interface ConversationPage extends PageMeta {
	items: ConversationSummary[];
}

/** An open conversation; `id` is null for a draft that has no message yet. */
export interface Thread extends MessagePage {
	id: string | null;
	/** Messages from the partner that were unseen when it was opened. */
	unread: number;
	partner: Partner;
}
