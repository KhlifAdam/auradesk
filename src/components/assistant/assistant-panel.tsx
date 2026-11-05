"use client";

import { Maximize2, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { loadThread } from "@/services/assistant/actions";
import { useAssistant } from "./assistant-provider";
import { AssistantShell } from "./assistant-shell";
import { ChatView } from "./chat/chat-view";
import { HistoryMenu } from "./history-menu";

/**
 * The studio's assistant: docked beside the page on wide screens (the page
 * shrinks instead of being covered), a floating bubble on phones and tablets.
 */
export function AssistantPanel({ team }: { team: boolean }) {
	const t = useTranslations("Assistant.panel");
	const { open } = useAssistant();

	return (
		<AssistantShell open={open} label={t("title")} dock="column">
			<PanelHeader />
			<PanelChat team={team} />
		</AssistantShell>
	);
}

function PanelHeader() {
	const t = useTranslations("Assistant.panel");
	const router = useRouter();
	const { setOpen, startNewThread, active, basePath } = useAssistant();
	const openPage = () =>
		router.push(
			active.messages?.length ? `${basePath}/${active.id}` : basePath,
		);

	return (
		<header className="flex h-12 shrink-0 items-center gap-1 border-b border-border/70 px-3">
			<Sparkles className="h-4 w-4 text-primary" />
			<h2 className="flex-1 font-display text-sm font-semibold">
				{t("title")}
			</h2>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="h-7 w-7"
				aria-label={t("newChat")}
				title={t("newChat")}
				onClick={startNewThread}
			>
				<Plus className="h-3.5 w-3.5" />
			</Button>
			<HistoryMenu />
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="h-7 w-7"
				aria-label={t("openPage")}
				title={t("openPage")}
				onClick={openPage}
			>
				<Maximize2 className="h-3.5 w-3.5" />
			</Button>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="h-7 w-7"
				aria-label={t("close")}
				title={t("close")}
				onClick={() => setOpen(false)}
			>
				<X className="h-3.5 w-3.5" />
			</Button>
		</header>
	);
}

/** The active thread, loaded from the server when it was picked from history. */
function PanelChat({ team }: { team: boolean }) {
	const { active, setActive, remember, startNewThread } = useAssistant();
	const settled = useCallback(
		(messages: AssistantUIMessage[]) => remember(active.id, messages),
		[remember, active.id],
	);

	useEffect(() => {
		if (active.messages !== null) return;
		let alive = true;
		loadThread(active.id).then((result) => {
			if (!alive) return;
			if (result.ok)
				setActive({ id: active.id, messages: result.data.messages });
			else startNewThread();
		});
		return () => {
			alive = false;
		};
	}, [active, setActive, startNewThread]);

	if (active.messages === null)
		return (
			<div className="flex flex-1 flex-col gap-3 p-4">
				<div className="ml-auto h-8 w-2/3 animate-pulse rounded-2xl bg-muted" />
				<div className="h-20 w-5/6 animate-pulse rounded-xl bg-muted" />
			</div>
		);

	return (
		<ChatView
			key={active.id}
			threadId={active.id}
			initialMessages={active.messages}
			team={team}
			onSettled={settled}
			autoFocus
		/>
	);
}
