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
					className="assistant-launcher group fixed right-8 bottom-7 z-40 flex h-12 items-center gap-2 rounded-full pr-5 pl-4 text-sm font-semibold text-primary-foreground duration-300 hover:scale-105 print:hidden"
				>
					<Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
					{t("fabLabel")}
				</motion.button>
			)}
		</AnimatePresence>
	);
}
