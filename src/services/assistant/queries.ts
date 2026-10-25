import "server-only";

import { ASSISTANT_LIMITS } from "@/lib/ai/assistant/limits";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { db } from "@/lib/db";
import { pageMeta, pageSkip } from "@/services/shared/pagination";
import type { AssistantSpace, ThreadPage, ThreadSummary } from "./types";

const DAY_MS = 86_400_000;
const PAGE_SIZE = ASSISTANT_LIMITS.threadPageSize;

const summarySelect = { id: true, title: true, updatedAt: true } as const;

const toSummary = (row: {
	id: string;
	title: string;
	updatedAt: Date;
}): ThreadSummary => ({
	id: row.id,
	title: row.title,
	updatedAt: row.updatedAt.toISOString(),
});

/** The user's threads, most recently active first. */
export async function listThreads(
	userId: string,
	page: number,
	space: AssistantSpace = "studio",
): Promise<ThreadPage> {
	const total = await db.assistantThread.count({ where: { userId, space } });
	const meta = pageMeta(page, total, PAGE_SIZE);
	const rows = await db.assistantThread.findMany({
		where: { userId, space },
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, PAGE_SIZE),
		take: PAGE_SIZE,
		select: summarySelect,
	});
	return { ...meta, items: rows.map(toSummary) };
}

/** The few latest threads, for the panel's history menu. */
export async function listRecentThreads(
	userId: string,
	take = 10,
	space: AssistantSpace = "studio",
) {
	const rows = await db.assistantThread.findMany({
		where: { userId, space },
		orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
		take,
		select: summarySelect,
	});
	return rows.map(toSummary);
}

/** A thread with its messages in order, or null when it isn't the user's. */
export async function getThread(
	userId: string,
	threadId: string,
	space: AssistantSpace = "studio",
) {
	const thread = await db.assistantThread.findFirst({
		where: { id: threadId, userId, space },
		select: {
			...summarySelect,
			messages: {
				orderBy: { position: "asc" },
				select: { id: true, role: true, parts: true },
			},
		},
	});
	if (!thread) return null;
	return {
		...toSummary(thread),
		messages: thread.messages as unknown as AssistantUIMessage[],
	};
}

/** Questions asked in the last 24 hours, for the daily cap. */
export function countRecentQuestions(userId: string) {
	return db.assistantMessage.count({
		where: {
			role: "user",
			thread: { userId },
			createdAt: { gte: new Date(Date.now() - DAY_MS) },
		},
	});
}
