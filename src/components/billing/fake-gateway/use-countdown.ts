"use client";

import { useEffect, useState } from "react";

/**
 * Time left until `deadline` (ISO), ticking every second. The clock starts
 * after hydration, so the server and the browser render the same text.
 */
export function useCountdown(deadline: string) {
	const end = new Date(deadline).getTime();
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	if (now === null) return { expired: false, label: "--:--" };
	const left = Math.max(0, Math.floor((end - now) / 1000));
	return {
		expired: left === 0,
		label: `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`,
	};
}
