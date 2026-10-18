import { flushSync } from "react-dom";

/**
 * Applies a theme change inside a view transition, so the page crossfades
 * from the old colours to the new ones instead of snapping. Falls back to an
 * instant switch where the API is missing or motion is reduced.
 */
export function withThemeTransition(apply: () => void) {
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (!document.startViewTransition || reduced) return apply();
	// The new theme must be in the DOM before the browser snapshots it.
	document.startViewTransition(() => flushSync(apply));
}
