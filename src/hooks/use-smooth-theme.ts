"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { withThemeTransition } from "@/lib/theme-transition";

/** `useTheme`, with a crossfade when the theme changes. */
export function useSmoothTheme() {
	const { setTheme, ...rest } = useTheme();
	const setSmoothTheme = useCallback(
		(theme: string) => withThemeTransition(() => setTheme(theme)),
		[setTheme],
	);
	return { ...rest, setTheme: setSmoothTheme };
}
