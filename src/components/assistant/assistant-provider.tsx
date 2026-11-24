"use client";

import { generateId } from "ai";
import { usePathname } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import { ASSISTANT_OPEN_COOKIE } from "./open-cookie";
import {
	useAssistantWakeWord,
	type WakeWordControl,
} from "./use-assistant-wake-word";

/** The conversation shown in the panel; messages are unknown until loaded. */
export interface ActiveThread {
	id: string;
	messages: AssistantUIMessage[] | null;
}

interface AssistantContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** Where the full-page assistant lives for this space. */
	basePath: string;
	/** True on the assistant page itself, where the panel stays hidden. */
	onPage: boolean;
	active: ActiveThread;
	setActive: (thread: ActiveThread) => void;
	/** Keeps the latest messages, so reopening the panel is instant. */
	remember: (id: string, messages: AssistantUIMessage[]) => void;
	startNewThread: () => void;
	/** Goes up each time the dictation shortcut is pressed. */
	dictationTick: number;
	/**
	 * True once if the shortcut opened the panel: the question box that mounts
	 * next starts dictating, since it missed the key press itself.
	 */
	consumeDictationOnOpen: () => boolean;
	/** The question box reports dictation, so "Hey Aura" steps aside. */
	setDictating: (dictating: boolean) => void;
	/** "Hey Aura": can it run here, is it on, and is it listening. */
	wakeWord: WakeWordControl;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
	const value = useContext(AssistantContext);
	if (!value) throw new Error("useAssistant needs an AssistantProvider");
	return value;
}

const newThread = (): ActiveThread => ({ id: generateId(), messages: [] });

/** Shared state for the floating button, the side panel and the page. */
export function AssistantProvider({
	children,
	initialOpen,
	basePath,
	remembersOpen = true,
	wakeWordKey = null,
}: {
	children: ReactNode;
	initialOpen: boolean;
	basePath: string;
	/** Picovoice access key; without one, the browser hears "Hey Aura". */
	wakeWordKey?: string | null;
	/** Keeps the panel open across pages (the dashboard); the portal starts closed. */
	remembersOpen?: boolean;
}) {
	const pathname = usePathname();
	const onPage = pathname.startsWith(basePath);
	const [open, setOpenState] = useState(initialOpen);
	const [active, setActive] = useState<ActiveThread>(newThread);
	const [dictationTick, setDictationTick] = useState(0);
	const dictateOnOpen = useRef(false);

	const setOpen = useCallback(
		(next: boolean) => {
			setOpenState(next);
			if (!remembersOpen) return;
			// biome-ignore lint/suspicious/noDocumentCookie: a plain UI preference read by the layout.
			document.cookie = `${ASSISTANT_OPEN_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
		},
		[remembersOpen],
	);

	const remember = useCallback(
		(id: string, messages: AssistantUIMessage[]) =>
			setActive((current) => (current.id === id ? { id, messages } : current)),
		[],
	);

	const startNewThread = useCallback(() => setActive(newThread()), []);

	const consumeDictationOnOpen = useCallback(() => {
		const pending = dictateOnOpen.current;
		dictateOnOpen.current = false;
		return pending;
	}, []);

	/** Opens the assistant if needed and starts (or stops) dictation. */
	const talk = useCallback(() => {
		if (!onPage && !open) {
			dictateOnOpen.current = true;
			setOpen(true);
		}
		setDictationTick((tick) => tick + 1);
	}, [onPage, open, setOpen]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const command = event.ctrlKey || event.metaKey;
			if (command && event.key.toLowerCase() === "j") {
				event.preventDefault();
				if (!onPage) setOpen(!open);
			}
			// Ctrl/⌘ + Shift + Space: talk to the assistant from anywhere.
			if (command && event.shiftKey && event.code === "Space") {
				event.preventDefault();
				if (!event.repeat) talk();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onPage, open, setOpen, talk]);

	// "Hey Aura" does what the dictation shortcut does.
	const [dictating, setDictating] = useState(false);
	const wakeWord = useAssistantWakeWord({
		picovoiceKey: wakeWordKey,
		paused: dictating,
		onWake: talk,
	});

	const value = useMemo(
		() => ({
			open: open && !onPage,
			setOpen,
			basePath,
			onPage,
			active,
			setActive,
			remember,
			startNewThread,
			dictationTick,
			consumeDictationOnOpen,
			setDictating,
			wakeWord,
		}),
		[
			open,
			onPage,
			setOpen,
			basePath,
			active,
			remember,
			startNewThread,
			dictationTick,
			consumeDictationOnOpen,
			wakeWord,
		],
	);

	return (
		<AssistantContext.Provider value={value}>
			{children}
		</AssistantContext.Provider>
	);
}
