"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "./assistant-provider";

/** The always-there button that opens the assistant (Ctrl/⌘ + J too). */
export function AssistantFab() {
	const t = useTranslations("Assistant");
	const { open, setOpen, onPage } = useAssistant();

	return (
		<AnimatePresence>
			{!open && !onPage && (
				<motion.button
					type="button"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{ duration: 0.2, ease: "easeOut" }}
					onClick={() => setOpen(true)}
					aria-label={t("fab")}
					title={`${t("fab")} (Ctrl+J)`}
					className="assistant-glass group fixed right-4 bottom-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 text-primary shadow-luminous transition-all duration-300 hover:scale-105 hover:shadow-luminous-lg print:hidden"
				>
					<span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
					<Sparkles className="relative h-5 w-5" />
				</motion.button>
			)}
		</AnimatePresence>
	);
}
