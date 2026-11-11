"use client";

import { Ear, EarOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssistant } from "./assistant-provider";

/**
 * Turns "Hey Aura" on or off for this browser, and shows whether it is
 * listening. Hidden where the server has no wake word key.
 */
export function WakeWordToggle() {
	const t = useTranslations("Assistant.wakeWord");
	const { wakeWord } = useAssistant();
	if (!wakeWord.available) return null;
	const { enabled, state } = wakeWord;
	const label = t(enabled ? state : "off");

	return (
		<Button
			type="button"
			size="icon"
			variant="ghost"
			className={cn(
				"relative h-7 w-7",
				state === "listening" && "text-primary",
				state === "error" && "text-destructive",
			)}
			aria-pressed={enabled}
			aria-label={label}
			title={label}
			onClick={() => wakeWord.setEnabled(!enabled)}
		>
			{state === "starting" ? (
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
			) : enabled ? (
				<Ear className="h-3.5 w-3.5" />
			) : (
				<EarOff className="h-3.5 w-3.5" />
			)}
			{state === "listening" && (
				<span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
			)}
		</Button>
	);
}
