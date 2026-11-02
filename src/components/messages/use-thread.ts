"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate as mutateGlobal } from "swr";
import {
	deleteMessage,
	editMessage,
	markConversationRead,
	sendMessage,
	setTyping,
} from "@/services/messages/actions";
import type { ChatMessage, LivePage, Thread } from "@/services/messages/types";
import type { MessageRole } from "@/services/messages/viewer";
import { fetchJson, usePolling } from "./polling";
import { unreadKey } from "./unread-badge";

const POLL_MS = 2000;
/** Typing is announced at most this often while the person keeps typing. */
const TYPING_THROTTLE_MS = 2500;
const SEEN_AFTER_MS = 5000;

const fetchPage = fetchJson<LivePage>;

const byTime = (a: ChatMessage, b: ChatMessage) =>
	a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/**
 * Live state of one conversation: the latest page is polled, older pages are
 * loaded on demand, and sent messages show at once. Opening it (or receiving
 * a message while it is open) marks it read.
 */
export function useThread(
	thread: Thread,
	viewer: { id: string; role: MessageRole },
	basePath: string,
) {
	const router = useRouter();
	const { id } = thread;
	const initial = {
		messages: thread.messages,
		hasMore: thread.hasMore,
		typing: false,
	};
	const { signedOut, options } = usePolling(POLL_MS);
	const { data, mutate } = useSWR(
		id && !signedOut ? `/api/messages/${id}` : null,
		fetchPage,
		{ ...options, fallbackData: initial },
	);
	const latest = data ?? initial;

	const [older, setOlder] = useState<ChatMessage[]>([]);
	const [olderHasMore, setOlderHasMore] = useState(false);
	const [sent, setSent] = useState<ChatMessage[]>([]);
	// Own edits and deletions show at once, before the next poll confirms them.
	const [patches, setPatches] = useState<Map<string, ChatMessage>>(new Map());
	const [isLoadingOlder, setLoadingOlder] = useState(false);
	// Messages unseen when the conversation opened stay bold for a moment.
	const [fresh, setFresh] = useState<Set<string>>(() =>
		thread.unread > 0
			? new Set(
					thread.messages
						.filter((m) => m.senderId !== viewer.id)
						.slice(-thread.unread)
						.map((m) => m.id),
				)
			: new Set(),
	);
	useEffect(() => {
		if (fresh.size === 0) return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const startTimer = () => {
			timer ??= setTimeout(() => setFresh(new Set()), SEEN_AFTER_MS);
		};
		// Only a tab the person is looking at counts as having seen them.
		const onVisibility = () => {
			if (document.visibilityState === "visible") startTimer();
		};
		onVisibility();
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			clearTimeout(timer);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [fresh]);

	const messages = useMemo(() => {
		const unique = new Map<string, ChatMessage>();
		for (const message of [...older, ...latest.messages, ...sent])
			unique.set(message.id, message);
		for (const [messageId, patch] of patches)
			if (unique.has(messageId)) unique.set(messageId, patch);
		return [...unique.values()].sort(byTime);
	}, [older, latest.messages, sent, patches]);
	const hasMore = older.length > 0 ? olderHasMore : latest.hasMore;

	const lastIncoming = messages.findLast((m) => m.senderId !== viewer.id)?.id;
	const marked = useRef<string | null>(null);
	useEffect(() => {
		if (!id || !lastIncoming || marked.current === lastIncoming) return;
		marked.current = lastIncoming;
		markConversationRead({ conversationId: id, as: viewer.role }).then(() => {
			mutateGlobal(unreadKey(viewer.role));
			router.refresh();
		});
	}, [id, lastIncoming, viewer.role, router]);

	async function loadOlder() {
		if (!id || !messages[0]) return;
		setLoadingOlder(true);
		try {
			const page = await fetchPage(
				`/api/messages/${id}?before=${messages[0].id}`,
			);
			setOlder((prev) => [...page.messages, ...prev]);
			setOlderHasMore(page.hasMore);
		} finally {
			setLoadingOlder(false);
		}
	}

	/** Returns the error code on failure. */
	async function send(body: string) {
		const result = await sendMessage({
			as: viewer.role,
			conversationId: id,
			partnerId: id ? null : thread.partner.id,
			body,
		});
		if (!result.ok) return result.error;
		setSent((prev) => [...prev, result.data.message]);
		if (id) {
			mutate();
			router.refresh();
		} else {
			router.replace(`${basePath}?c=${result.data.conversationId}`);
		}
		return null;
	}

	function patch(message: ChatMessage, changes: Partial<ChatMessage>) {
		setPatches((prev) =>
			new Map(prev).set(message.id, { ...message, ...changes }),
		);
	}

	/** Returns the error code on failure. */
	async function edit(message: ChatMessage, body: string) {
		const result = await editMessage({
			as: viewer.role,
			messageId: message.id,
			body,
		});
		if (!result.ok) return result.error;
		patch(message, { body, editedAt: new Date().toISOString() });
		mutate();
		router.refresh();
		return null;
	}

	/** Returns the error code on failure. */
	async function remove(message: ChatMessage) {
		const result = await deleteMessage({
			as: viewer.role,
			messageId: message.id,
		});
		if (!result.ok) return result.error;
		patch(message, { body: "", deleted: true });
		mutate();
		router.refresh();
		return null;
	}

	const lastTyping = useRef(0);
	/** Call on every keystroke; the server is told at most every few seconds. */
	function notifyTyping() {
		if (!id || Date.now() - lastTyping.current < TYPING_THROTTLE_MS) return;
		lastTyping.current = Date.now();
		setTyping({ conversationId: id, as: viewer.role });
	}

	return {
		messages,
		fresh,
		hasMore,
		isLoadingOlder,
		loadOlder,
		send,
		edit,
		remove,
		notifyTyping,
		partnerTyping: latest.typing,
	};
}
