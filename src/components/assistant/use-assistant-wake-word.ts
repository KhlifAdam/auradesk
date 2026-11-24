"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	useBrowserWakeWord,
	useBrowserWakeWordSupport,
} from "./use-browser-wake-word";
import { useWakeWord, type WakeWordState } from "./use-wake-word";

/** "Hey Aura" is a choice made per browser, off by default. */
const WAKE_WORD_STORAGE = "aura-wake-word";

export interface WakeWordControl {
	available: boolean;
	enabled: boolean;
	setEnabled: (enabled: boolean) => void;
	state: WakeWordState;
}

/**
 * "Hey Aura" for the assistant. The browser's speech recognition listens by
 * default; with a Picovoice key the on-device engine is used instead.
 */
export function useAssistantWakeWord({
	picovoiceKey,
	paused,
	onWake,
}: {
	picovoiceKey: string | null;
	/** True while dictating: the microphone is busy with the question. */
	paused: boolean;
	onWake: () => void;
}): WakeWordControl {
	const locale = useLocale();
	const browserSupported = useBrowserWakeWordSupport();
	const [enabled, setEnabledState] = useState(false);
	useEffect(() => {
		try {
			setEnabledState(localStorage.getItem(WAKE_WORD_STORAGE) === "1");
		} catch {
			// Storage blocked: it simply starts off.
		}
	}, []);
	const setEnabled = useCallback((next: boolean) => {
		setEnabledState(next);
		try {
			localStorage.setItem(WAKE_WORD_STORAGE, next ? "1" : "0");
		} catch {
			// Storage blocked: the choice lasts for this visit only.
		}
	}, []);

	const usePicovoice = Boolean(picovoiceKey);
	const picovoiceState = useWakeWord({
		accessKey: picovoiceKey,
		enabled: enabled && usePicovoice,
		onWake,
	});
	const browserState = useBrowserWakeWord({
		enabled: enabled && !usePicovoice && !paused,
		locale,
		onWake,
	});
	// Paused for dictation still reads as on, not as turned off.
	const state = usePicovoice
		? picovoiceState
		: paused && enabled
			? "listening"
			: browserState;

	return useMemo(
		() => ({
			available: usePicovoice || browserSupported,
			enabled,
			setEnabled,
			state,
		}),
		[usePicovoice, browserSupported, enabled, setEnabled, state],
	);
}
