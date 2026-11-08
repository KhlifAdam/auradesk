"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "./assistant-provider";
import { LauncherDock } from "./launcher-dock";
import {
	LauncherEffects,
	LauncherIcon,
	useLauncherMotion,
} from "./launcher-motion";

/**
 * The always-there button that opens the assistant (Ctrl/⌘ + J too).
 * It can be dragged out of the way; it snaps to the nearest side.
 */
export function AssistantFab() {
	const t = useTranslations("Assistant");
	const { open, setOpen, onPage } = useAssistant();
	const { still, float } = useLauncherMotion();

	return (
		<LauncherDock
			storageKey="assistant-fab-place-v3"
			className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 lg:right-8 lg:bottom-7 print:hidden"
		>
			{({ wasDragged }) => (
				<AnimatePresence>
					{!open && !onPage && (
						<motion.div
							key="assistant-fab"
							initial={{ opacity: 0, scale: 0.6, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ type: "spring", stiffness: 260, damping: 18 }}
						>
							<motion.button
								type="button"
								onClick={() => {
									if (!wasDragged()) setOpen(true);
								}}
								aria-label={t("fab")}
								title={`${t("fab")} (Ctrl+J) · ${t("fabDrag")}`}
								{...float}
								whileHover={{ scale: 1.08 }}
								whileTap={{ scale: 0.95 }}
								className="assistant-launcher group relative flex h-12 cursor-[inherit] items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-primary-foreground sm:pr-5 sm:pl-4"
							>
								<LauncherEffects still={still} />
								<LauncherIcon still={still}>
									<Sparkles className="h-5 w-5" />
								</LauncherIcon>
								<span className="relative hidden sm:inline">
									{t("fabLabel")}
								</span>
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</LauncherDock>
	);
}
