"use client";

import { useEffect } from "react";

/**
 * Drops `?payment=` from the address once the notice is shown, so a later
 * refresh (or any change made on the page) doesn't show it again.
 */
export function ForgetPaymentResult() {
	useEffect(() => {
		const url = new URL(window.location.href);
		if (!url.searchParams.has("payment")) return;
		url.searchParams.delete("payment");
		window.history.replaceState(window.history.state, "", url);
	}, []);
	return null;
}
