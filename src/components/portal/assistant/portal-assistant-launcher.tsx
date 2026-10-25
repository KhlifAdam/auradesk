"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircleHeart, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAssistant } from "@/components/assistant/assistant-provider";

const GREETED_KEY = "portal-assistant-greeted";
const GREETING_DELAY_MS = 3500;
const GREETING_SHOWN_MS = 9000;

function greetedAlready() {
	try {
		return sessionStorage.getItem(GREETED_KEY) === "1";
	} catch {
		return true;
	}
}

function markGreeted() {
	try {
		sessionStorage.setItem(GREETED_KEY, "1");
	} catch {
		// Private mode: the greeting just shows again next visit.
	}
}

/**
 * The floating help button: it breathes gently, glows, and says hello once
 * per visit so clients notice they can ask. Calm when reduced motion is on.
 */
export function PortalAssistantLauncher() {
	const t = useTranslations("Assistant.portal");
	const { open, setOpen } = useAssistant();
	const still = useReducedMotion();
	const [greeting, setGreeting] = useState(false);

	useEffect(() => {
		if (greetedAlready()) return;
		const show = window.setTimeout(() => setGreeting(true), GREETING_DELAY_MS);
		const hide = window.setTimeout(() => {
			setGreeting(false);
			markGreeted();
		}, GREETING_DELAY_MS + GREETING_SHOWN_MS);
		return () => {
			window.clearTimeout(show);
			window.clearTimeout(hide);
		};
	}, []);

	const launch = () => {
		setGreeting(false);
		markGreeted();
		setOpen(true);
	};

	return (
		<AnimatePresence>
			{!open && (
				<motion.div
					key="launcher"
					initial={{ opacity: 0, y: 16, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 16, scale: 0.9 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
					className="fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2 md:right-7 md:bottom-7 print:hidden"
				>
					<AnimatePresence>
						{greeting && (
							<motion.div
								initial={{ opacity: 0, y: 8, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 8, scale: 0.95 }}
								transition={{ duration: 0.3, ease: "easeOut" }}
								className="assistant-glass relative flex max-w-64 items-start gap-2 rounded-2xl rounded-br-sm border border-border px-3 py-2 text-xs shadow-lg"
							>
								<button
									type="button"
									onClick={launch}
									className="cursor-pointer text-left"
								>
									<span className="block font-semibold">
										{t("greetingTitle")}
									</span>
									<span className="text-muted-foreground">{t("greeting")}</span>
								</button>
								<button
									type="button"
									aria-label={t("dismiss")}
									onClick={() => {
										setGreeting(false);
										markGreeted();
									}}
									className="-mt-0.5 -mr-1 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground"
								>
									<X className="h-3 w-3" />
								</button>
							</motion.div>
						)}
					</AnimatePresence>

					<motion.button
						type="button"
						onClick={launch}
						aria-label={t("open")}
						title={t("open")}
						animate={still ? undefined : { y: [0, -5, 0] }}
						transition={
							still
								? undefined
								: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
						}
						whileHover={{ scale: 1.06 }}
						whileTap={{ scale: 0.95 }}
						className="assistant-launcher group relative flex h-14 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold text-primary-foreground md:pr-5"
					>
						{!still && (
							<motion.span
								aria-hidden
								className="absolute inset-0 rounded-full ring-2 ring-primary/60"
								animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
								transition={{
									duration: 2.2,
									repeat: Infinity,
									ease: "easeOut",
									repeatDelay: 1.2,
								}}
							/>
						)}
						<motion.span
							animate={still ? undefined : { rotate: [0, -14, 12, -8, 0] }}
							transition={
								still
									? undefined
									: {
											duration: 1.1,
											repeat: Infinity,
											repeatDelay: 5,
											ease: "easeInOut",
										}
							}
							className="flex"
						>
							<MessageCircleHeart className="h-5 w-5" />
						</motion.span>
						<span className="hidden md:inline">{t("label")}</span>
					</motion.button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
