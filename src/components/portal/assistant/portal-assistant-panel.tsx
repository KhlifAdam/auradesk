"use client";

import { MessageCircleHeart, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import { useAssistant } from "@/components/assistant/assistant-provider";
import { AssistantShell } from "@/components/assistant/assistant-shell";
import { ChatView } from "@/components/assistant/chat/chat-view";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { loadPortalThread } from "@/services/assistant/actions";

const THREAD_KEY = "portal-assistant-thread";

const store = {
	get: () => {
		try {
			return localStorage.getItem(THREAD_KEY);
		} catch {
			return null;
		}
	},
	set: (id: string | null) => {
		try {
			if (id) localStorage.setItem(THREAD_KEY, id);
			else localStorage.removeItem(THREAD_KEY);
		} catch {
			// Storage blocked: the conversation simply starts fresh next time.
		}
	},
};

/** The client's help chat: docked beside the page on wide screens, a bubble on phones. */
export function PortalAssistantPanel() {
	const t = useTranslations("Assistant.portal");
	const { open, setOpen, active, setActive, remember, startNewThread } =
		useAssistant();
	const restored = useRef(false);

	// Pick the last conversation up again, once.
	useEffect(() => {
		if (restored.current) return;
		restored.current = true;
		const id = store.get();
		if (id) setActive({ id, messages: null });
	}, [setActive]);

	useEffect(() => {
		if (active.messages !== null) return;
		let alive = true;
		loadPortalThread(active.id).then((result) => {
			if (!alive) return;
			if (result.ok)
				setActive({ id: active.id, messages: result.data.messages });
			else {
				store.set(null);
				startNewThread();
			}
		});
		return () => {
			alive = false;
		};
	}, [active, setActive, startNewThread]);

	const settled = useCallback(
		(messages: AssistantUIMessage[]) => {
			store.set(active.id);
			remember(active.id, messages);
		},
		[remember, active.id],
	);

	const fresh = () => {
		store.set(null);
		startNewThread();
	};

	return (
		<AssistantShell open={open} label={t("title")} dock="under-header">
			<header className="flex h-12 shrink-0 items-center gap-1 border-b border-border/70 px-3">
				<MessageCircleHeart className="h-4 w-4 text-primary" />
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
					onClick={fresh}
				>
					<Plus className="h-3.5 w-3.5" />
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
			{active.messages === null ? (
				<div className="flex flex-1 flex-col gap-3 p-4">
					<div className="ml-auto h-8 w-2/3 animate-pulse rounded-2xl bg-muted" />
					<div className="h-20 w-5/6 animate-pulse rounded-xl bg-muted" />
				</div>
			) : (
				<ChatView
					key={active.id}
					threadId={active.id}
					initialMessages={active.messages}
					team={false}
					portal
					onSettled={settled}
					autoFocus
				/>
			)}
		</AssistantShell>
	);
}
