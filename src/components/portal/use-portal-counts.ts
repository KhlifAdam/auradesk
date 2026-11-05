"use client";

import useSWR from "swr";
import { fetchJson, usePolling } from "@/components/messages/polling";
import type { PortalNavCounts } from "./portal-nav";

const POLL_MS = 8000;
export const PORTAL_COUNTS_KEY = "/api/portal/counts";

/** The nav counts, kept current by polling; `initial` is what the server rendered. */
export function usePortalCounts(initial: PortalNavCounts) {
	const { signedOut, options } = usePolling(POLL_MS);
	const { data } = useSWR(
		signedOut ? null : PORTAL_COUNTS_KEY,
		fetchJson<PortalNavCounts>,
		{ ...options, fallbackData: initial },
	);
	return data ?? initial;
}
