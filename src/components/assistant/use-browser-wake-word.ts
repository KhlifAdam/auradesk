"use client";

import { useEffect, useRef, useState } from "react";
import type { WakeWordState } from "./use-wake-word";
import { heardWakePhrase } from "./wake-phrase";

/**
 * "Hey Aura" through the browser's own speech recognition (Web Speech API).
 * Free and needs no key, but the browser sends the audio to its speech
 * service (Google in Chrome) the whole time it listens, and Firefox has none.
 *
 * Picovoice Porcupine (use-wake-word.ts) is the on-device engine we may go
 * back to: it takes over as soon as PICOVOICE_ACCESS_KEY is set and the
 * trained public/wake/hey-aura.ppn is in place.
 */

/** The part of the Web Speech API used here; TypeScript's DOM lib lacks it. */
interface Recognition {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
	onerror: ((event: { error: string }) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	abort: () => void;
}
type RecognitionClass = new () => Recognition;

function recognitionClass(): RecognitionClass | null {
	if (typeof window === "undefined") return null;
	const w = window as unknown as Record<string, RecognitionClass | undefined>;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True in browsers that have speech recognition (checked after mounting). */
export function useBrowserWakeWordSupport(): boolean {
	const [supported, setSupported] = useState(false);
	useEffect(() => setSupported(recognitionClass() !== null), []);
	return supported;
}

/** Errors that won't go away by listening again. */
const FATAL = new Set([
	"not-allowed",
	"service-not-allowed",
	"language-not-supported",
	"audio-capture",
	// No speech service behind the API (Brave, some Chromium builds).
	"network",
]);
/** Pause before listening again, so a failing service can't spin. */
const RESTART_MS = 400;

/** Development only: what the wake word hears and does, in the console. */
const trace = (...args: unknown[]) => {
	if (process.env.NODE_ENV === "development")
		console.log("[Hey Aura]", ...args);
};

export function useBrowserWakeWord({
	enabled,
	locale,
	onWake,
}: {
	/** Off while the person is dictating, so the two don't hear each other. */
	enabled: boolean;
	locale: string;
	onWake: () => void;
}): WakeWordState {
	const [state, setState] = useState<WakeWordState>("off");
	const onWakeRef = useRef(onWake);
	onWakeRef.current = onWake;

	useEffect(() => {
		const Recognition = recognitionClass();
		if (!enabled || !Recognition) {
			if (enabled) trace("this browser has no speech recognition");
			setState("off");
			return;
		}
		let stopped = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const recognition = new Recognition();
		recognition.lang = locale.startsWith("fr") ? "fr-FR" : "en-US";
		recognition.continuous = true;
		recognition.interimResults = true;

		const listen = () => {
			try {
				recognition.start();
				trace("listening", recognition.lang);
				setState("listening");
			} catch {
				// Already started: nothing to do.
			}
		};
		recognition.onresult = (event) => {
			const heard = Array.from(event.results, (r) => r[0]?.transcript ?? "");
			trace("heard:", heard.join(" "));
			if (!heardWakePhrase(heard.join(" "))) return;
			// Starting over clears what was heard, so one phrase wakes once.
			recognition.abort();
			onWakeRef.current();
		};
		recognition.onerror = (event) => {
			trace("error:", event.error);
			if (!FATAL.has(event.error)) return; // "no-speech", "aborted"…: onend retries
			stopped = true;
			console.error("Hey Aura could not start:", event.error);
			setState("error");
		};
		// Browsers stop listening after a silence or a minute: start again.
		recognition.onend = () => {
			trace("stopped", stopped ? "" : "(restarting)");
			if (!stopped) timer = setTimeout(listen, RESTART_MS);
		};

		setState("starting");
		listen();
		return () => {
			stopped = true;
			clearTimeout(timer);
			recognition.onend = null;
			recognition.abort();
		};
	}, [enabled, locale]);

	return state;
}
