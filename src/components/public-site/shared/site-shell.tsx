"use client";

import type { CSSProperties, ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { ThemeMode } from "@/generated/prisma/client";
import { withThemeTransition } from "@/lib/theme-transition";

type SiteTheme = "light" | "dark" | "system";

interface SiteThemeContextValue {
	/** Whether visitors may switch (theme mode BOTH). */
	canToggle: boolean;
	/** Effective scheme right now (system resolved). */
	isDark: boolean;
	toggle: () => void;
	/** Address of the studio this site belongs to ("" for demo data). */
	studioSlug: string;
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

function useSiteContext() {
	const context = useContext(SiteThemeContext);
	if (!context) throw new Error("Site hooks must be used inside SiteShell");
	return context;
}

export function useSiteTheme() {
	return useSiteContext();
}

/** The studio's slug, for links that must carry the studio (e.g. client area). */
export function useStudioSlug() {
	return useSiteContext().studioSlug;
}

function useSystemDark() {
	const [isDark, setIsDark] = useState(false);
	useEffect(() => {
		const query = window.matchMedia("(prefers-color-scheme: dark)");
		setIsDark(query.matches);
		const onChange = (event: MediaQueryListEvent) => setIsDark(event.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);
	return isDark;
}

interface SiteShellProps {
	mode: ThemeMode;
	initialTheme: SiteTheme;
	/** Remembers the visitor's choice per site. */
	storageKey: string;
	studioSlug: string;
	lang: string;
	style: CSSProperties;
	className: string;
	children: ReactNode;
}

/** Site root: owns the light/dark state, scoped to this site only. */
export function SiteShell({
	mode,
	initialTheme,
	storageKey,
	studioSlug,
	lang,
	style,
	className,
	children,
}: SiteShellProps) {
	const canToggle = mode === "BOTH";
	const [theme, setTheme] = useState<SiteTheme>(initialTheme);
	const systemDark = useSystemDark();

	// Restore a previous explicit choice (only when visitors may choose).
	useEffect(() => {
		if (!canToggle) return setTheme(initialTheme);
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved === "light" || saved === "dark") setTheme(saved);
		} catch {
			// Storage can be unavailable (private mode); keep following the OS.
		}
	}, [canToggle, initialTheme, storageKey]);

	const isDark = theme === "dark" || (theme === "system" && systemDark);

	const toggle = useCallback(() => {
		const next = isDark ? "light" : "dark";
		withThemeTransition(() => setTheme(next));
		try {
			localStorage.setItem(storageKey, next);
		} catch {
			// Not persisted; the choice still applies for this visit.
		}
	}, [isDark, storageKey]);

	const value = useMemo(
		() => ({ canToggle, isDark, toggle, studioSlug }),
		[canToggle, isDark, toggle, studioSlug],
	);

	return (
		<SiteThemeContext.Provider value={value}>
			<div
				data-site-theme={theme}
				lang={lang}
				style={style}
				className={className}
			>
				{children}
			</div>
		</SiteThemeContext.Provider>
	);
}
