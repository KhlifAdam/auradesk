"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { cn } from "@/lib/utils";
import { loadThread } from "@/services/assistant/actions";
import { useAssistant } from "./assistant-provider";
import { ChatView } from "./chat/chat-view";
import { HistoryMenu } from "./history-menu";

const DESKTOP = "(min-width: 1024px)";

function useIsDesktop() {
	return useSyncExternalStore(
		(onChange) => {
			const query = window.matchMedia(DESKTOP);
			query.addEventListener("change", onChange);
			return () => query.removeEventListener("change", onChange);
		},
		() => window.matchMedia(DESKTOP).matches,
		() => true,
	);
}

/**
 * The assistant beside the page. On wide screens it takes its own column, so
 * the page shrinks instead of being covered; on small ones it fills the screen.
 */
export function AssistantPanel({ team }: { team: boolean }) {
	const { open } = useAssistant();
	const desktop = useIsDesktop();

	return (
		<AnimatePresence initial={false}>
			{open && (
				<motion.aside
					key="assistant-panel"
					initial={desktop ? { width: 0 } : { x: "100%" }}
					animate={desktop ? { width: "auto" } : { x: 0 }}
					exit={desktop ? { width: 0 } : { x: "100%" }}
					transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
					className={cn(
						"overflow-hidden border-border print:hidden",
						desktop
							? "relative h-full shrink-0 border-l"
							: "fixed inset-0 z-50",
					)}
				>
					<div
						className={cn(
							"assistant-glass assistant-aura flex h-full flex-col",
							desktop ? "w-(--assistant-panel-width)" : "w-full",
						)}
					>
						<PanelHeader />
						<PanelChat team={team} />
					</div>
				</motion.aside>
			)}
		</AnimatePresence>
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
