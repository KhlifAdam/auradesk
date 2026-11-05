"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { PortalNavCounts } from "./portal-nav";
import { usePortalCounts } from "./use-portal-counts";

/**
 * Redraws the page when a count changes (a project was added, a request
 * arrived), so lists update without a reload. Renders nothing.
 */
export function PortalLiveRefresh({ initial }: { initial: PortalNavCounts }) {
	const router = useRouter();
	const counts = usePortalCounts(initial);
	const key = `${counts.projects ?? 0}:${counts.bookings ?? 0}:${counts.invoices ?? 0}`;
	const previous = useRef(key);

	useEffect(() => {
		if (previous.current === key) return;
		previous.current = key;
		router.refresh();
	}, [key, router]);

	return null;
}
