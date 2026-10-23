import type { PageMeta } from "@/services/shared/pagination";

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

export interface ChatMessage {
	id: string;
	senderId: string;
	body: string;
	createdAt: string;
}

export interface MessagePage {
	/** Oldest first. */
	messages: ChatMessage[];
	hasMore: boolean;
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
