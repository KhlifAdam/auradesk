"use client";

import { isToolUIPart } from "ai";
import { Sparkles } from "lucide-react";
import { memo } from "react";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { Markdown } from "./markdown";
import { ToolPart } from "./tool-part";
import type { AssistantChat } from "./use-assistant-chat";

interface MessageItemProps {
	message: AssistantUIMessage;
	settle: AssistantChat["settle"];
	/** The answer being written right now. */
	streaming: boolean;
}

/** A question as a bubble; an answer as prose with its cards in between. */
function MessageItemBase({ message, settle, streaming }: MessageItemProps) {
	if (message.role === "user") {
		const text = message.parts
			.map((part) => (part.type === "text" ? part.text : ""))
			.join("");
		return (
			<div className="flex justify-end">
				<p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground shadow-sm">
					{text}
				</p>
			</div>
		);
	}

	return (
		<div className="flex gap-2.5">
			<span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 text-primary ring-1 ring-primary/25">
				<Sparkles className="h-3.5 w-3.5" />
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-2.5">
				{message.parts.map((part, index) => {
					if (part.type === "text" && part.text.trim())
						return (
							<Markdown
								// biome-ignore lint/suspicious/noArrayIndexKey: parts only ever grow.
								key={index}
								text={part.text}
								streaming={streaming}
							/>
						);
					if (isToolUIPart(part))
						return (
							<ToolPart key={part.toolCallId} part={part} settle={settle} />
						);
					return null;
				})}
			</div>
		</div>
	);
}

export const MessageItem = memo(MessageItemBase);

/** Dots shown while the assistant hasn't written anything yet. */
export function ThinkingDots() {
	return (
		<div className="flex gap-2.5">
			<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
				<Sparkles className="h-3.5 w-3.5 animate-pulse" />
			</span>
			<div className="flex items-center gap-1 pt-1">
				{[0, 150, 300].map((delay) => (
					<span
						key={delay}
						className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70"
						style={{ animationDelay: `${delay}ms` }}
					/>
				))}
			</div>
		</div>
	);
}
