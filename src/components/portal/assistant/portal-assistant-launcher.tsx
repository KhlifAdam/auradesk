"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAssistant } from "@/components/assistant/assistant-provider";
import { LauncherDock } from "@/components/assistant/launcher-dock";
import {
	LauncherEffects,
	LauncherIcon,
	useLauncherMotion,
} from "@/components/assistant/launcher-motion";
import { cn } from "@/lib/utils";

const GREETED_KEY = "portal-assistant-greeted";
const GREETING_DELAY_MS = 1500;
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
 * The floating help button: it floats, pulses and says hello once per visit
 * so clients notice they can ask. Still when reduced motion is on. It can be
 * dragged out of the way and snaps to the nearest side.
 */
export function PortalAssistantLauncher() {
	const t = useTranslations("Assistant.portal");
	const { open, setOpen } = useAssistant();
	const { still, float } = useLauncherMotion();
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
		<LauncherDock
			storageKey="portal-assistant-place-v3"
			className="fixed right-4 bottom-20 z-40 md:right-7 md:bottom-7 print:hidden"
		>
			{({ side, wasDragged }) => (
				<AnimatePresence>
					{!open && (
						<motion.div
							key="launcher"
							initial={{ opacity: 0, y: 20, scale: 0.6 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 16, scale: 0.9 }}
							transition={{ type: "spring", stiffness: 260, damping: 18 }}
							className={cn(
								"flex flex-col gap-2",
								side === "left" ? "items-start" : "items-end",
							)}
						>
							<AnimatePresence>
								{greeting && (
									<motion.div
										initial={{ opacity: 0, y: 8, scale: 0.95 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 8, scale: 0.95 }}
										transition={{ duration: 0.3, ease: "easeOut" }}
										className={cn(
											"assistant-glass relative flex max-w-64 cursor-auto items-start gap-2 rounded-2xl border border-border px-3 py-2 text-xs shadow-lg",
											side === "left" ? "rounded-bl-sm" : "rounded-br-sm",
										)}
									>
										<button
											type="button"
											onClick={launch}
											className="cursor-pointer text-left"
										>
											<span className="block font-semibold">
												{t("greetingTitle")}
											</span>
											<span className="text-muted-foreground">
												{t("greeting")}
											</span>
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
								onClick={() => {
									if (!wasDragged()) launch();
								}}
								aria-label={t("open")}
								title={`${t("open")} · ${t("drag")}`}
								{...float}
								whileHover={{ scale: 1.08 }}
								whileTap={{ scale: 0.95 }}
								className="assistant-launcher group relative flex h-14 cursor-[inherit] items-center gap-2 rounded-full px-4 text-sm font-semibold text-primary-foreground md:pr-5"
							>
								<LauncherEffects still={still} />
								<LauncherIcon still={still}>
									<MessageCircleHeart className="h-5 w-5" />
								</LauncherIcon>
								<span className="relative hidden md:inline">{t("label")}</span>
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</LauncherDock>
	);
}
