"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { BookDesign } from "@/lib/books/design";
import { bookReducer } from "@/lib/books/design-reducer";
import { saveBook } from "@/services/books/actions";

const SAVE_DELAY_MS = 900;

export type SaveStatus = "saved" | "saving" | "error";

/**
 * The book being edited, saved a moment after each change. `flush` saves right
 * away (the PDF is made from what is saved, so downloading waits for it), and
 * leaving the page with unsaved changes asks first.
 */
export function useBookDesign(
	bookId: string,
	initial: BookDesign,
	onSaveError: (code: string) => void,
) {
	const [design, dispatch] = useReducer(bookReducer, initial);
	const [status, setStatus] = useState<SaveStatus>("saved");
	const saved = useRef(JSON.stringify(initial));
	const latest = useRef(design);
	latest.current = design;
	const queue = useRef<Promise<unknown>>(Promise.resolve());

	const save = useCallback(() => {
		queue.current = queue.current.then(async () => {
			const json = JSON.stringify(latest.current);
			if (json === saved.current) return setStatus("saved");
			const result = await saveBook({ id: bookId, design: latest.current });
			if (!result.ok) {
				setStatus("error");
				return onSaveError(result.error);
			}
			saved.current = json;
			// More edits may have landed while this one was on its way.
			setStatus(JSON.stringify(latest.current) === json ? "saved" : "saving");
		});
		return queue.current;
	}, [bookId, onSaveError]);

	useEffect(() => {
		if (JSON.stringify(design) === saved.current) return;
		setStatus("saving");
		const timer = window.setTimeout(save, SAVE_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [design, save]);

	useEffect(() => {
		if (status === "saved") return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [status]);

	return { design, dispatch, status, flush: save };
}
