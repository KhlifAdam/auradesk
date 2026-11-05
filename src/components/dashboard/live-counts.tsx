"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import { fetchJson, usePolling } from "@/components/messages/polling";
import { NavCount } from "@/components/portal/nav-count";

const POLL_MS = 8000;

interface StudioCounts {
	bookings: number;
	projects: number;
}

/** What clients sent or changed that the studio hasn't opened, kept current. */
function useStudioCounts() {
	const { signedOut, options } = usePolling(POLL_MS);
	const { data } = useSWR(
		signedOut ? null : "/api/dashboard/counts",
		fetchJson<StudioCounts>,
		options,
	);
	return data;
}

/** A nav count for bookings or projects; hidden when nothing is waiting. */
export function StudioCountBadge({
	kind,
	className,
}: {
	kind: keyof StudioCounts;
	className?: string;
}) {
	const counts = useStudioCounts();
	return <NavCount count={counts?.[kind]} className={className} />;
}

/** Redraws the page when a count changes, so lists light up live. */
export function StudioLiveRefresh() {
	const router = useRouter();
	const counts = useStudioCounts();
	const key = counts ? `${counts.bookings}:${counts.projects}` : null;
	const previous = useRef(key);

	useEffect(() => {
		if (key === null) return;
		if (previous.current !== null && previous.current !== key) router.refresh();
		previous.current = key;
	}, [key, router]);

	return null;
}
