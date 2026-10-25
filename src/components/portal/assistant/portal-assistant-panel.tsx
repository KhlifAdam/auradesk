"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import { useAssistant } from "@/components/assistant/assistant-provider";
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

/** The client's help chat, floating over the portal; full screen on phones. */
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
		<AnimatePresence>
			{open && (
				<motion.div
					key="portal-assistant"
					role="dialog"
					aria-label={t("title")}
					initial={{ opacity: 0, y: 24, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 24, scale: 0.96 }}
					transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
					style={{ transformOrigin: "bottom right" }}
					className="assistant-glass assistant-aura fixed inset-0 z-50 flex flex-col overflow-hidden border-border shadow-2xl sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100vh-3rem))] sm:w-[400px] sm:rounded-2xl sm:border print:hidden"
				>
					<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 px-3">
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/35 to-primary/10 text-primary ring-1 ring-primary/30">
							<MessageCircleHeart className="h-4 w-4" />
						</span>
						<div className="flex min-w-0 flex-1 flex-col">
							<h2 className="font-display text-sm font-semibold">
								{t("title")}
							</h2>
							<span className="flex items-center gap-1 text-[11px] text-muted-foreground">
								<span className="h-1.5 w-1.5 rounded-full bg-success" />
								{t("status")}
							</span>
						</div>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-8 w-8"
							aria-label={t("newChat")}
							title={t("newChat")}
							onClick={fresh}
						>
							<Plus className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-8 w-8"
							aria-label={t("close")}
							title={t("close")}
							onClick={() => setOpen(false)}
						>
							<X className="h-4 w-4" />
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
				</motion.div>
			)}
		</AnimatePresence>
	);
}
