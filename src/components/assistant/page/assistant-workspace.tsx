"use client";

import { generateId } from "ai";
import { Plus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { cn } from "@/lib/utils";
import type { ThreadPage, ThreadSummary } from "@/services/assistant/types";
import { useAssistant } from "../assistant-provider";
import { ChatView } from "../chat/chat-view";
import { ThreadList } from "./thread-list";

interface Current {
	id: string;
	messages: AssistantUIMessage[];
	/** Not saved yet: the URL and the list catch up after the first answer. */
	fresh: boolean;
}

const firstQuestion = (messages: AssistantUIMessage[]) =>
	messages
		.find((m) => m.role === "user")
		?.parts.map((p) => (p.type === "text" ? p.text : ""))
		.join(" ")
		.slice(0, 60) ?? "";

/**
 * The page's state: which conversation is open, and the list beside it. A new
 * conversation gets its address once it has an answer, without a reload.
 */
export function AssistantWorkspace({
	threads,
	thread,
	team,
	basePath,
}: {
	threads: ThreadPage;
	thread: { id: string; messages: AssistantUIMessage[] } | null;
	team: boolean;
	basePath: string;
}) {
	const t = useTranslations("Assistant.page");
	const { setActive } = useAssistant();
	const [current, setCurrent] = useState<Current>(() =>
		thread
			? { ...thread, fresh: false }
			: { id: generateId(), messages: [], fresh: true },
	);
	const [added, setAdded] = useState<ThreadSummary[]>([]);

	const settled = useCallback(
		(messages: AssistantUIMessage[]) => {
			// The panel picks this conversation up when the user leaves the page.
			setActive({ id: current.id, messages });
			if (!current.fresh) return;
			window.history.replaceState(null, "", `${basePath}/${current.id}`);
			setAdded((list) => [
				{
					id: current.id,
					title: firstQuestion(messages),
					updatedAt: new Date().toISOString(),
				},
				...list,
			]);
			setCurrent((c) => ({ ...c, fresh: false }));
		},
		[basePath, current.fresh, current.id, setActive],
	);

	const startNew = () => {
		window.history.replaceState(null, "", basePath);
		setCurrent({ id: generateId(), messages: [], fresh: true });
	};

	const listed = threads.items.filter(
		(item) => !added.some((a) => a.id === item.id),
	);

	return (
		<div
			className={cn(
				"flex min-h-0 flex-1 overflow-hidden",
				// The team space scrolls as a page, so the workspace gets its own height.
				team &&
					"h-[calc(100dvh-9rem)] flex-none rounded-xl border border-border",
			)}
		>
			<aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
				<div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
					<Sparkles className="h-4 w-4 text-primary" />
					<h1 className="flex-1 font-display text-sm font-semibold">
						{t("title")}
					</h1>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-7 gap-1 px-2 text-xs"
						onClick={startNew}
					>
						<Plus className="h-3.5 w-3.5" />
						{t("newChat")}
					</Button>
				</div>
				<ThreadList
					threads={{ ...threads, items: [...added, ...listed] }}
					activeId={current.fresh ? null : current.id}
					basePath={basePath}
					onDeletedActive={startNew}
				/>
			</aside>
			<div className="assistant-aura flex min-w-0 flex-1 flex-col">
				<div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">
					<ChatView
						key={current.id}
						threadId={current.id}
						initialMessages={current.messages}
						team={team}
						onSettled={settled}
						autoFocus
					/>
				</div>
			</div>
		</div>
	);
}
