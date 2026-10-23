import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { clientBookingWhere } from "@/services/portal/booking-queries";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import { CONVERSATION_PAGE_SIZE, MESSAGE_PAGE_SIZE } from "./constants";
import type {
	ChatMessage,
	ConversationPage,
	ConversationSummary,
	MessagePage,
	Partner,
	Thread,
} from "./types";
import { ownConversations, pairWith, unreadField, type Viewer } from "./viewer";

const partnerSelect = {
	id: true,
	name: true,
	image: true,
	studio: { select: { name: true, slug: true, published: true } },
} satisfies Prisma.UserSelect;

const conversationInclude = {
	client: { select: partnerSelect },
	photographer: { select: partnerSelect },
} satisfies Prisma.ConversationInclude;

type PartnerRow = Prisma.UserGetPayload<{ select: typeof partnerSelect }>;
type ConversationRow = Prisma.ConversationGetPayload<{
	include: typeof conversationInclude;
}>;

const toPartner = (row: PartnerRow): Partner => ({
	id: row.id,
	name: row.name,
	image: row.image,
	studioName: row.studio?.name ?? null,
	siteSlug: row.studio?.published ? row.studio.slug : null,
});

const partnerOf = (row: ConversationRow, viewer: Viewer) =>
	toPartner(viewer.role === "photographer" ? row.client : row.photographer);

/**
 * Whether this pair may start a chat: they share a project, or a booking the
 * client can see (sent to them, or asked for by them), so the details can be
 * discussed before anything is confirmed.
 */
export async function canConverse(photographerId: string, clientId: string) {
	const shared = await db.project.count({
		where: { photographerId, clientId },
	});
	if (shared > 0) return true;
	const client = await db.user.findUnique({
		where: { id: clientId },
		select: {
			id: true,
			email: true,
			emailVerified: true,
			phoneNumber: true,
			phoneNumberVerified: true,
		},
	});
	if (!client) return false;
	const bookings = await db.booking.count({
		where: { photographerId, ...clientBookingWhere(client) },
	});
	return bookings > 0;
}

/** The person to write to, if the viewer may start a chat with them. */
export async function findNewPartner(
	viewer: Viewer,
	partnerId: string,
): Promise<Partner | null> {
	const { photographerId, clientId } = pairWith(viewer, partnerId);
	if (!(await canConverse(photographerId, clientId))) return null;
	const row = await db.user.findUnique({
		where: { id: partnerId },
		select: partnerSelect,
	});
	return row ? toPartner(row) : null;
}

export function findConversationWith(viewer: Viewer, partnerId: string) {
	return db.conversation.findUnique({
		where: { photographerId_clientId: pairWith(viewer, partnerId) },
		select: { id: true },
	});
}

function toSummary(row: ConversationRow, viewer: Viewer): ConversationSummary {
	return {
		id: row.id,
		partner: partnerOf(row, viewer),
		lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
		preview: row.lastMessagePreview ?? "",
		lastFromMe: row.lastSenderId === viewer.id,
		unread: row[unreadField(viewer.role)],
	};
}

/** Conversations with at least one message, newest first. */
export async function listConversations(
	viewer: Viewer,
	requestedPage: number,
): Promise<ConversationPage> {
	const where = { ...ownConversations(viewer), lastMessageAt: { not: null } };
	const total = await db.conversation.count({ where });
	const meta = pageMeta(requestedPage, total, CONVERSATION_PAGE_SIZE);
	const rows = await db.conversation.findMany({
		where,
		include: conversationInclude,
		orderBy: [{ lastMessageAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, CONVERSATION_PAGE_SIZE),
		take: CONVERSATION_PAGE_SIZE,
	});
	return { ...meta, items: rows.map((row) => toSummary(row, viewer)) };
}

const toChatMessage = (row: {
	id: string;
	senderId: string;
	body: string;
	createdAt: Date;
}): ChatMessage => ({
	id: row.id,
	senderId: row.senderId,
	body: row.body,
	createdAt: row.createdAt.toISOString(),
});

/** One page of messages, oldest first; `before` pages further back. */
export async function listMessages(
	conversationId: string,
	before?: string,
): Promise<MessagePage> {
	let cursor: Prisma.MessageWhereInput = {};
	if (before) {
		const anchor = await db.message.findFirst({
			where: { id: before, conversationId },
			select: { createdAt: true },
		});
		if (anchor)
			cursor = {
				OR: [
					{ createdAt: { lt: anchor.createdAt } },
					{ createdAt: anchor.createdAt, id: { lt: before } },
				],
			};
	}
	const rows = await db.message.findMany({
		where: { conversationId, ...cursor },
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: MESSAGE_PAGE_SIZE + 1,
	});
	return {
		messages: rows.slice(0, MESSAGE_PAGE_SIZE).map(toChatMessage).reverse(),
		hasMore: rows.length > MESSAGE_PAGE_SIZE,
	};
}

/** An existing conversation of the viewer, with its latest messages. */
export async function getThread(
	viewer: Viewer,
	conversationId: string,
): Promise<Thread | null> {
	const row = await db.conversation.findFirst({
		where: { id: conversationId, ...ownConversations(viewer) },
		include: conversationInclude,
	});
	if (!row) return null;
	return {
		id: row.id,
		partner: partnerOf(row, viewer),
		unread: row[unreadField(viewer.role)],
		...(await listMessages(row.id)),
	};
}

/** Total unread messages across all of the viewer's conversations. */
export async function countUnread(viewer: Viewer) {
	const field = unreadField(viewer.role);
	const total = await db.conversation.aggregate({
		where: ownConversations(viewer),
		_sum: { photographerUnread: true, clientUnread: true },
	});
	return total._sum[field] ?? 0;
}
