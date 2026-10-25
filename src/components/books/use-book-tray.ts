"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadBookPhotos } from "@/services/books/actions";
import type { BookPhoto } from "@/services/books/types";

/** The delivered photos a book can use, loaded a page at a time as the client asks. */
export function useBookTray(
	projectId: string,
	load: typeof loadBookPhotos = loadBookPhotos,
) {
	const [items, setItems] = useState<BookPhoto[]>([]);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);
	const nextPage = useRef(1);
	const busy = useRef(false);

	const loadMore = useCallback(async () => {
		if (busy.current) return;
		busy.current = true;
		setLoading(true);
		setFailed(false);
		const result = await load({
			projectId,
			page: nextPage.current,
		}).catch(() => null);
		if (result?.ok) {
			const { items: more, page, pageCount, total } = result.data;
			setItems((current) => {
				const known = new Set(current.map((photo) => photo.id));
				return [...current, ...more.filter((photo) => !known.has(photo.id))];
			});
			setTotal(total);
			setHasMore(page < pageCount);
			nextPage.current = page + 1;
		} else setFailed(true);
		busy.current = false;
		setLoading(false);
	}, [projectId, load]);

	useEffect(() => {
		void loadMore();
	}, [loadMore]);

	return { items, total, hasMore, loading, failed, loadMore };
}
