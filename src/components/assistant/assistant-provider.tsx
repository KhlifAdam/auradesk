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
}: {
	children: ReactNode;
	initialOpen: boolean;
	basePath: string;
}) {
	const pathname = usePathname();
	const onPage = pathname.startsWith(basePath);
	const [open, setOpenState] = useState(initialOpen);
	const [active, setActive] = useState<ActiveThread>(newThread);
	const [dictationTick, setDictationTick] = useState(0);
	const dictateOnOpen = useRef(false);

	const setOpen = useCallback((next: boolean) => {
		setOpenState(next);
		// biome-ignore lint/suspicious/noDocumentCookie: a plain UI preference read by the layout.
		document.cookie = `${ASSISTANT_OPEN_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
	}, []);

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
				if (event.repeat) return;
				if (!onPage && !open) {
					dictateOnOpen.current = true;
					setOpen(true);
				}
				setDictationTick((tick) => tick + 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onPage, open, setOpen]);

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
		],
	);

	return (
		<AssistantContext.Provider value={value}>
			{children}
		</AssistantContext.Provider>
	);
}
