export const MESSAGE_ROLES = ["photographer", "client"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

/** Who is looking at their messages, and from which side. */
export interface Viewer {
	id: string;
	role: MessageRole;
}

/** Scopes a conversation query to the viewer's own conversations. */
export function ownConversations(viewer: Viewer) {
	return viewer.role === "photographer"
		? { photographerId: viewer.id }
		: { clientId: viewer.id };
}

export const unreadField = (role: MessageRole) =>
	role === "photographer" ? "photographerUnread" : "clientUnread";

export const typingField = (role: MessageRole) =>
	role === "photographer" ? "photographerTypingAt" : "clientTypingAt";

export const otherRole = (role: MessageRole): MessageRole =>
	role === "photographer" ? "client" : "photographer";

/** The unique photographer/client key of a viewer's conversation with `partnerId`. */
export function pairWith(viewer: Viewer, partnerId: string) {
	return viewer.role === "photographer"
		? { photographerId: viewer.id, clientId: partnerId }
		: { photographerId: partnerId, clientId: viewer.id };
}
