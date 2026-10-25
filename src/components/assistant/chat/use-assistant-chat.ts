"use client";

import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	isToolUIPart,
	lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import {
	isWriteTool,
	toolOutcome,
	WRITE_TOOLS,
	type WriteToolInput,
	type WriteToolName,
	type WriteToolOutput,
} from "@/lib/ai/assistant/write-tools";
import type { AssistantSpace } from "@/services/assistant/types";
import { runWriteTool } from "../actions/action-registry";

/** A write tool call still waiting for the user's Confirm or Cancel. */
export const isAwaitingUser = (part: AssistantUIMessage["parts"][number]) =>
	isToolUIPart(part) &&
	part.state === "input-available" &&
	isWriteTool(part.type.slice("tool-".length));

/**
 * The conversation with the assistant. Only the newest message goes to the
 * server (it keeps the history); tools that change data run here, through
 * the app's Server Actions, then the answer continues on its own.
 */
export function useAssistantChat(
	threadId: string,
	initialMessages: AssistantUIMessage[],
	space: AssistantSpace = "studio",
) {
	const router = useRouter();
	const errorMessage = useErrorMessage();

	const transport = useMemo(
		() =>
			new DefaultChatTransport<AssistantUIMessage>({
				api: "/api/assistant",
				prepareSendMessagesRequest: ({ id, messages }) => ({
					body: { id, space, message: messages.at(-1) },
				}),
			}),
		[space],
	);

	const chat = useChat<AssistantUIMessage>({
		id: threadId,
		messages: initialMessages,
		transport,
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
		async onToolCall({ toolCall }) {
			if (toolCall.dynamic || !isWriteTool(toolCall.toolName)) return;
			if (WRITE_TOOLS[toolCall.toolName].tier !== "auto") return;
			// Small internal changes run at once; the card shows them as done.
			void respond(
				toolCall.toolName,
				toolCall.toolCallId,
				await execute(
					toolCall.toolName,
					toolCall.input as WriteToolInput<WriteToolName>,
				),
			);
		},
	});
	const { addToolOutput } = chat;

	const execute = useCallback(
		async <N extends WriteToolName>(
			name: N,
			input: WriteToolInput<N>,
		): Promise<WriteToolOutput> => {
			const parsed = WRITE_TOOLS[name].inputSchema.safeParse(input);
			if (!parsed.success)
				return toolOutcome.failed(errorMessage("invalidInput"));
			try {
				const result = await runWriteTool(
					name,
					parsed.data as WriteToolInput<N>,
				);
				if (!result.ok) return toolOutcome.failed(errorMessage(result.error));
				router.refresh();
				return toolOutcome.done();
			} catch {
				return toolOutcome.failed(errorMessage(undefined));
			}
		},
		[errorMessage, router],
	);

	const respond = useCallback(
		(name: WriteToolName, toolCallId: string, output: WriteToolOutput) =>
			addToolOutput({ tool: name, toolCallId, output } as unknown as Parameters<
				typeof addToolOutput
			>[0]),
		[addToolOutput],
	);

	/** Runs a confirmed action, or tells the model it was cancelled. */
	const settle = useCallback(
		async <N extends WriteToolName>(
			name: N,
			toolCallId: string,
			input: WriteToolInput<N> | null,
		) => {
			const output: WriteToolOutput = input
				? await execute(name, input)
				: toolOutcome.cancelled();
			await respond(name, toolCallId, output);
			return output;
		},
		[execute, respond],
	);

	const awaitingUser =
		chat.messages.at(-1)?.parts.some(isAwaitingUser) ?? false;

	return { ...chat, settle, awaitingUser };
}

export type AssistantChat = ReturnType<typeof useAssistantChat>;
