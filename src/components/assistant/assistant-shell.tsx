"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const DESKTOP = "(min-width: 1024px)";

function useIsDesktop() {
	return useSyncExternalStore(
		(onChange) => {
			const query = window.matchMedia(DESKTOP);
			query.addEventListener("change", onChange);
			return () => query.removeEventListener("change", onChange);
		},
		() => window.matchMedia(DESKTOP).matches,
		() => true,
	);
}

interface AssistantShellProps {
	open: boolean;
	label: string;
	/**
	 * Where the docked panel sits on wide screens: `column` takes its own column
	 * in a flex row (the dashboard); `under-header` is fixed to the right edge,
	 * below the portal's top bar.
	 */
	dock: "column" | "under-header";
	children: ReactNode;
}

/**
 * The frame of the assistant, shared by the studio and the client space. On
 * wide screens it docks beside the page, which makes room for it; on phones
 * and tablets it is a floating bubble over the page, like a chat app.
 */
export function AssistantShell({
	open,
	label,
	dock,
	children,
}: AssistantShellProps) {
	const desktop = useIsDesktop();

	return (
		<AnimatePresence initial={false}>
			{open &&
				(desktop ? (
					<motion.aside
						key="assistant-dock"
						aria-label={label}
						initial={{ width: 0 }}
						animate={{ width: "auto" }}
						exit={{ width: 0 }}
						transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
						className={cn(
							"overflow-hidden border-l border-border print:hidden",
							dock === "column"
								? "relative h-full shrink-0"
								: "fixed top-14 right-0 bottom-0 z-30",
						)}
					>
						<div className="assistant-glass assistant-aura flex h-full w-(--assistant-panel-width) flex-col">
							{children}
						</div>
					</motion.aside>
				) : (
					<motion.div
						key="assistant-bubble"
						role="dialog"
						aria-label={label}
						initial={{ opacity: 0, y: 24, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 24, scale: 0.96 }}
						transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
						style={{ transformOrigin: "bottom right" }}
						className="assistant-glass assistant-aura fixed inset-x-3 bottom-3 z-50 flex h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px] print:hidden"
					>
						{children}
					</motion.div>
				))}
		</AnimatePresence>
	);
}
