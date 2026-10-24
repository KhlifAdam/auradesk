import {
	convertToModelMessages,
	createIdGenerator,
	createUIMessageStreamResponse,
	isStepCount,
	streamText,
	toUIMessageStream,
	validateUIMessages,
} from "ai";
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { ASSISTANT_LIMITS } from "@/lib/ai/assistant/limits";
import { buildSystemPrompt } from "@/lib/ai/assistant/system-prompt";
import {
	type AssistantUIMessage,
	buildAssistantTools,
} from "@/lib/ai/assistant/tools";
import { toAssistantViewer } from "@/lib/ai/assistant/viewer";
import { getAssistantModel } from "@/lib/ai/openrouter";
import { getApiUser } from "@/lib/auth/api-session";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { countRecentQuestions, getThread } from "@/services/assistant/queries";
import { claimThread, saveThreadMessages } from "@/services/assistant/store";
import { getSubscription } from "@/services/billing/queries";
import { getStudioSummary } from "@/services/studio/queries";

export const maxDuration = 60;

const bodySchema = z.object({
	id: z.string().min(8).max(64),
	message: z.object({
		id: z.string().min(1).max(64),
		role: z.enum(["user", "assistant"]),
		parts: z.array(z.unknown()).max(200),
	}),
});

const deny = (error: string, status: number) =>
	NextResponse.json({ error }, { status });

const textOf = (message: AssistantUIMessage) =>
	message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

/**
 * One turn of the assistant. The client sends only its latest message (a new
 * question, or the last answer with a tool result added); the history comes
 * from the database, so it can't be rewritten from the browser.
 */
export async function POST(request: Request) {
	const user = await getApiUser();
	if (!user) return deny("unauthorized", 401);
	const viewer = toAssistantViewer(user);
	if (!viewer) return deny("forbidden", 403);
	const model = getAssistantModel();
	if (!model) return deny("assistantUnavailable", 503);

	const parsed = bodySchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return deny("invalidInput", 400);
	const { id: threadId } = parsed.data;
	const incoming = parsed.data.message as unknown as AssistantUIMessage;

	if (viewer.kind === "photographer") {
		const subscription = await getSubscription(viewer.photographerId);
		if (subscription.status === "expired") return deny("expired", 403);
	}

	const stored = (await getThread(viewer.userId, threadId))?.messages ?? [];
	const known = stored.findIndex((m) => m.id === incoming.id);
	if (known === -1 && incoming.role !== "user")
		return deny("invalidInput", 400);
	if (known === -1) {
		if (textOf(incoming).length > ASSISTANT_LIMITS.messageChars)
			return deny("tooLong", 400);
		const asked = await countRecentQuestions(viewer.userId);
		if (asked >= ASSISTANT_LIMITS.dailyMessages) return deny("dailyLimit", 429);
	}
	const history =
		known === -1
			? [...stored, incoming]
			: stored.map((m, i) => (i === known ? incoming : m));

	if (!(await claimThread(viewer.userId, threadId, history)))
		return deny("notFound", 404);

	const [locale, timeZone, studio] = await Promise.all([
		getLocale(),
		getRequestTimeZone(),
		viewer.kind === "photographer"
			? getStudioSummary(viewer.photographerId)
			: null,
	]);
	const tools = buildAssistantTools(viewer, { locale, timeZone });
	const messages = await validateUIMessages<AssistantUIMessage>({
		messages: history,
		tools,
	});

	const result = streamText({
		model,
		system: buildSystemPrompt({
			viewer,
			userName: user.name,
			studioName: studio?.name ?? null,
			locale,
			timeZone,
		}),
		messages: await convertToModelMessages(messages, { tools }),
		tools,
		stopWhen: isStepCount(ASSISTANT_LIMITS.maxSteps),
	});
	// Run to the end even if the tab closes, so the answer is still saved.
	result.consumeStream();

	return createUIMessageStreamResponse({
		stream: toUIMessageStream({
			stream: result.stream,
			originalMessages: messages,
			generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
			onEnd: ({ messages: final }) =>
				saveThreadMessages(threadId, final as AssistantUIMessage[]),
			onError: () => "assistantError",
		}),
	});
}
