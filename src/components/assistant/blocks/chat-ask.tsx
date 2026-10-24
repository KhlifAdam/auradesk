"use client";

import { createContext, type ReactNode, useContext } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";

type Part = AssistantUIMessage["parts"][number];

/** A read tool's result, typed from its definition. */
export type ToolOutput<N extends string> = NonNullable<
	Extract<Part, { type: `tool-${N}`; state: "output-available" }>["output"]
>;

interface ChatAsk {
	/** Sends a follow-up as if the user typed it. */
	ask: (text: string) => void;
	/** True while the assistant is answering or waiting on a card. */
	busy: boolean;
}

const ChatAskContext = createContext<ChatAsk>({ ask: () => {}, busy: true });

export const ChatAskProvider = ChatAskContext.Provider;
export const useChatAsk = () => useContext(ChatAskContext);

/** A small button on a card that asks the assistant to do the next step. */
export function AskButton({
	prompt,
	variant = "outline",
	children,
}: {
	prompt: string;
	variant?: "outline" | "default" | "ghost";
	children: ReactNode;
}) {
	const { ask, busy } = useChatAsk();
	return (
		<Button
			type="button"
			size="sm"
			variant={variant}
			disabled={busy}
			className="h-6 rounded-md px-2 text-[11px]"
			onClick={() => ask(prompt)}
		>
			{children}
		</Button>
	);
}
