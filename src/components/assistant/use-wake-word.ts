"use client";

import { useEffect, useRef, useState } from "react";

/** Picovoice's English model and the trained "Hey Aura" keyword, in public/wake/. */
const MODEL_PATH = "/wake/porcupine_params.pv";
const KEYWORD_PATH = "/wake/hey-aura.ppn";
/** Higher catches more "Hey Aura"s, at the cost of more false alarms. */
const SENSITIVITY = 0.65;

export type WakeWordState = "off" | "starting" | "listening" | "error";

/**
 * Listens for "Hey Aura" on the device itself (Picovoice Porcupine, as
 * WebAssembly): no sound leaves the browser until the phrase is heard, then
 * `onWake` runs. The engine is only loaded once the person turns it on.
 */
export function useWakeWord({
	accessKey,
	enabled,
	onWake,
}: {
	accessKey: string | null;
	enabled: boolean;
	onWake: () => void;
}): WakeWordState {
	const [state, setState] = useState<WakeWordState>("off");
	const onWakeRef = useRef(onWake);
	onWakeRef.current = onWake;

	useEffect(() => {
		if (!enabled || !accessKey) {
			setState("off");
			return;
		}
		let cancelled = false;
		let stop: (() => Promise<void>) | null = null;
		setState("starting");

		(async () => {
			try {
				const [{ PorcupineWorker }, { WebVoiceProcessor }] = await Promise.all([
					import("@picovoice/porcupine-web"),
					import("@picovoice/web-voice-processor"),
				]);
				const engine = await PorcupineWorker.create(
					accessKey,
					{
						label: "hey-aura",
						publicPath: KEYWORD_PATH,
						sensitivity: SENSITIVITY,
					},
					() => onWakeRef.current(),
					{ publicPath: MODEL_PATH, version: 1 },
				);
				stop = async () => {
					await WebVoiceProcessor.unsubscribe(engine);
					await engine.release();
				};
				if (cancelled) return void stop();
				await WebVoiceProcessor.subscribe(engine);
				setState("listening");
			} catch (error) {
				// No key file yet, an invalid key, or the microphone refused.
				console.error("Hey Aura could not start:", error);
				if (!cancelled) setState("error");
			}
		})();

		return () => {
			cancelled = true;
			void stop?.();
		};
	}, [enabled, accessKey]);

	return state;
}
