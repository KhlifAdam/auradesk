"use client";

import { useCallback, useEffect, useState } from "react";

/** Counts down whole seconds to 0, one tick a second; `start` (re)starts it. */
export function useCountdown() {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (seconds <= 0) return;
		const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
		return () => clearTimeout(timer);
	}, [seconds]);

	const start = useCallback((from: number) => setSeconds(from), []);
	return { seconds, start };
}
