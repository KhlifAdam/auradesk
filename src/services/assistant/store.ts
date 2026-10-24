import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { db } from "@/lib/db";

const TITLE_LENGTH = 60;

/** The thread's name: the start of the first question. */
export function titleFrom(messages: AssistantUIMessage[]) {
	const first = messages.find((m) => m.role === "user");
	const text = first?.parts
		.map((part) => (part.type === "text" ? part.text : ""))
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
	if (!text) return "…";
	return text.length > TITLE_LENGTH
		? `${text.slice(0, TITLE_LENGTH - 1)}…`
		: text;
}

/** Makes sure the thread exists and is the user's; false when it's someone else's. */
export async function claimThread(
	userId: string,
	threadId: string,
	firstMessages: AssistantUIMessage[],
) {
	const thread = await db.assistantThread.findUnique({
		where: { id: threadId },
		select: { userId: true },
	});
	if (thread) return thread.userId === userId;
	await db.assistantThread.create({
		data: { id: threadId, userId, title: titleFrom(firstMessages) },
	});
	return true;
}

/**
 * Saves the conversation after a turn. Earlier messages never change, except
 * the last one or two: a tool's result lands in the latest assistant message.
 * New messages are inserted, so each keeps the time it was first written.
 */
export async function saveThreadMessages(
	threadId: string,
	messages: AssistantUIMessage[],
) {
	const existing = await db.assistantMessage.findMany({
		where: { threadId },
		select: { id: true },
	});
	const known = new Set(existing.map((m) => m.id));
	const json = (m: AssistantUIMessage) =>
		m.parts as unknown as Prisma.InputJsonValue;

	const fresh = messages
		.map((m, position) => ({ m, position }))
		.filter(({ m }) => !known.has(m.id));
	const touched = messages
		.map((m, position) => ({ m, position }))
		.filter(({ m }) => known.has(m.id))
		.slice(-2);

	await db.$transaction([
		...touched.map(({ m, position }) =>
			db.assistantMessage.update({
				where: { threadId_id: { threadId, id: m.id } },
				data: { parts: json(m), position },
			}),
		),
		db.assistantMessage.createMany({
			data: fresh.map(({ m, position }) => ({
				threadId,
				id: m.id,
				role: m.role,
				parts: json(m),
				position,
			})),
		}),
		db.assistantThread.update({
			where: { id: threadId },
			data: { updatedAt: new Date() },
		}),
	]);
}
