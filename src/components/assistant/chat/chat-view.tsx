"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { cn } from "@/lib/utils";
import { ChatAskProvider } from "../blocks/chat-ask";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageItem, ThinkingDots } from "./message-item";
import { useAssistantChat } from "./use-assistant-chat";

const ERRORS = [
	"dailyLimit",
	"tooLong",
	"expired",
	"assistantUnavailable",
] as const;

/** The route answers errors as `{ error: code }`; anything else is generic. */
function errorCode(error: Error | undefined) {
	try {
		const code = JSON.parse(error?.message ?? "").error;
		return ERRORS.includes(code)
			? (code as (typeof ERRORS)[number])
			: "generic";
	} catch {
		return "generic";
	}
}

interface ChatViewProps {
	threadId: string;
	initialMessages: AssistantUIMessage[];
	team: boolean;
	/** After each finished answer, with the whole conversation. */
	onSettled?: (messages: AssistantUIMessage[]) => void;
	autoFocus?: boolean;
	className?: string;
}

/** A conversation: messages, cards, and the question box. */
export function ChatView({
	threadId,
	initialMessages,
	team,
	onSettled,
	autoFocus,
	className,
}: ChatViewProps) {
	const t = useTranslations("Assistant");
	const chat = useAssistantChat(threadId, initialMessages);
	const { messages, status, sendMessage, stop, settle, awaitingUser } = chat;
	const answering = status === "submitted" || status === "streaming";
	const bottom = useRef<HTMLDivElement>(null);

	const ask = useCallback(
		(text: string) => void sendMessage({ text }),
		[sendMessage],
	);
	const askContext = useMemo(
		() => ({ ask, busy: answering || awaitingUser }),
		[ask, answering, awaitingUser],
	);

	useEffect(() => {
		if (status === "ready" && messages.length > 0) onSettled?.(messages);
	}, [status, messages, onSettled]);

	// Follow the conversation as it grows.
	useEffect(() => {
		bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages, status]);

	const last = messages.at(-1);
	const thinking =
		status === "submitted" ||
		(status === "streaming" &&
			last?.role === "assistant" &&
			last.parts.length <= 1);

	return (
		<ChatAskProvider value={askContext}>
			<div className={cn("flex min-h-0 flex-1 flex-col", className)}>
				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
					{messages.length === 0 ? (
						<EmptyState team={team} onPick={ask} />
					) : (
						<div className="flex flex-col gap-4">
							{messages.map((message, index) => (
								<MessageItem
									key={message.id}
									message={message}
									settle={settle}
									streaming={answering && index === messages.length - 1}
								/>
							))}
							{thinking && <ThinkingDots />}
							{status === "error" && (
								<div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
									<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
									<span className="flex-1">
										{t(`errors.${errorCode(chat.error)}`)}
									</span>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										className="h-6 px-2 text-xs"
										onClick={() => chat.regenerate()}
									>
										<RotateCcw className="h-3 w-3" />
										{t("errors.retry")}
									</Button>
								</div>
							)}
						</div>
					)}
					<div ref={bottom} />
				</div>
				<div className="shrink-0 px-3 pt-1 pb-3">
					<Composer
						onSend={ask}
						onStop={stop}
						answering={answering}
						blocked={awaitingUser && !answering}
						autoFocus={autoFocus}
					/>
				</div>
			</div>
		</ChatAskProvider>
	);
}
