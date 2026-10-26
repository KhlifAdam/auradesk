"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "./assistant-provider";
import {
	LauncherEffects,
	LauncherIcon,
	useLauncherMotion,
} from "./launcher-motion";

/** The always-there button that opens the assistant (Ctrl/⌘ + J too). */
export function AssistantFab() {
	const t = useTranslations("Assistant");
	const { open, setOpen, onPage } = useAssistant();
	const { still, float } = useLauncherMotion();

	return (
		<AnimatePresence>
			{!open && !onPage && (
				<motion.div
					key="assistant-fab"
					initial={{ opacity: 0, scale: 0.6, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{ type: "spring", stiffness: 260, damping: 18 }}
					className="fixed right-8 bottom-7 z-40 print:hidden"
				>
					<motion.button
						type="button"
						onClick={() => setOpen(true)}
						aria-label={t("fab")}
						title={`${t("fab")} (Ctrl+J)`}
						{...float}
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.95 }}
						className="assistant-launcher group relative flex h-12 cursor-pointer items-center gap-2 rounded-full pr-5 pl-4 text-sm font-semibold text-primary-foreground"
					>
						<LauncherEffects still={still} />
						<LauncherIcon still={still}>
							<Sparkles className="h-5 w-5" />
						</LauncherIcon>
						<span className="relative">{t("fabLabel")}</span>
					</motion.button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
