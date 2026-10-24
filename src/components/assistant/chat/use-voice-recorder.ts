"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASSISTANT_LIMITS } from "@/lib/ai/assistant/limits";
import { toSpeechWav } from "@/lib/audio/pcm";
import { type LiveSpeech, openLiveSpeech } from "@/lib/audio/soniox-stream";
import { type AudioCapture, captureAudio, LEVEL_BARS } from "./capture-audio";

export type VoiceState = "idle" | "recording" | "transcribing";
export type VoiceError =
	| "micDenied"
	| "micUnavailable"
	| "voiceFailed"
	| "dailyLimit";

const ENDPOINT = "/api/assistant/transcribe";

function transcribe(wav: Blob, preview: boolean, signal?: AbortSignal) {
	const body = new FormData();
	body.append("audio", wav, "voice.wav");
	return fetch(preview ? `${ENDPOINT}?preview=1` : ENDPOINT, {
		method: "POST",
		body,
		signal,
	});
}

/** A one-use key for live dictation, or why there isn't one. */
async function liveSpeechKey(): Promise<string | "limit" | null> {
	const response = await fetch(`${ENDPOINT}/token`, { method: "POST" }).catch(
		() => null,
	);
	if (response?.status === 429) return "limit";
	if (!response?.ok) return null;
	return ((await response.json()) as { key: string }).key;
}

interface Session {
	chunks: Float32Array[];
	capture: AudioCapture;
	live: LiveSpeech | null;
	timers: number[];
}

/**
 * Records a voice note and turns it into text, shown as you speak.
 * - Live (when a Soniox key is set): the microphone streams to Soniox and
 *   words appear as they are recognized; stopping returns the final text.
 * - Otherwise: the note so far is re-read every few seconds for a preview,
 *   and read once more in full when you stop.
 * Nothing is sent when nobody spoke, and the audio is never stored.
 */
export function useVoiceRecorder({
	onText,
	onError,
}: {
	onText: (text: string) => void;
	onError: (error: VoiceError) => void;
}) {
	const [state, setState] = useState<VoiceState>("idle");
	const [seconds, setSeconds] = useState(0);
	const [levels, setLevels] = useState<number[]>(() =>
		Array(LEVEL_BARS).fill(0),
	);
	const [liveText, setLiveText] = useState("");
	const session = useRef<Session | null>(null);
	const preview = useRef<AbortController | null>(null);

	const finish = useCallback(
		async (text: string) => {
			setLiveText("");
			setState("idle");
			// Nothing heard is fine: the box just stays as it was.
			if (text) onText(text);
		},
		[onText],
	);

	const stop = useCallback(async () => {
		const current = session.current;
		if (!current) return;
		session.current = null;
		preview.current?.abort();
		for (const timer of current.timers) window.clearInterval(timer);
		current.capture.stop();
		setLevels(Array(LEVEL_BARS).fill(0));
		setState("transcribing");

		if (current.live) return finish(await current.live.finish());

		const wav = toSpeechWav(current.chunks, current.capture.rate);
		if (!wav) return finish("");
		try {
			const response = await transcribe(wav, false);
			setLiveText("");
			setState("idle");
			if (response.status === 429) return onError("dailyLimit");
			if (!response.ok) return onError("voiceFailed");
			const { text } = (await response.json()) as { text: string };
			if (text) onText(text);
		} catch {
			setLiveText("");
			setState("idle");
			onError("voiceFailed");
		}
	}, [finish, onError, onText]);

	const refreshPreview = useCallback(async () => {
		const current = session.current;
		if (!current || preview.current) return;
		const wav = toSpeechWav(current.chunks, current.capture.rate);
		if (!wav) return;
		const controller = new AbortController();
		preview.current = controller;
		try {
			const response = await transcribe(wav, true, controller.signal);
			if (!response.ok) return;
			const { text } = (await response.json()) as { text: string };
			// The final reading replaces it; a late preview must not.
			if (session.current === current) setLiveText(text);
		} catch {
			// A preview that fails is just skipped; the next one tries again.
		} finally {
			if (preview.current === controller) preview.current = null;
		}
	}, []);

	const start = useCallback(async () => {
		const chunks: Float32Array[] = [];
		let live: LiveSpeech | null = null;
		let capture: AudioCapture;
		try {
			capture = await captureAudio((samples) => {
				// Until the live connection is up, samples wait in `chunks`.
				if (live) live.send(samples, capture.rate);
				else chunks.push(samples);
			}, setLevels);
		} catch (error) {
			const refused =
				error instanceof DOMException &&
				(error.name === "NotAllowedError" || error.name === "SecurityError");
			return onError(refused ? "micDenied" : "micUnavailable");
		}

		const startedAt = Date.now();
		const timers = [
			window.setInterval(() => {
				const elapsed = Math.floor((Date.now() - startedAt) / 1000);
				setSeconds(elapsed);
				if (elapsed >= ASSISTANT_LIMITS.voiceSeconds) void stop();
			}, 500),
		];
		const current: Session = { chunks, capture, live: null, timers };
		session.current = current;
		setSeconds(0);
		setLiveText("");
		setState("recording");

		const key = await liveSpeechKey();
		if (session.current !== current) return; // stopped while connecting
		if (key === "limit") {
			void stop();
			return onError("dailyLimit");
		}
		if (key) {
			live = openLiveSpeech(key, {
				onText: setLiveText,
				onFailure: () => onError("voiceFailed"),
			});
			current.live = live;
			for (const samples of chunks.splice(0)) live.send(samples, capture.rate);
		} else {
			timers.push(
				window.setInterval(
					() => void refreshPreview(),
					ASSISTANT_LIMITS.previewEveryMs,
				),
			);
		}
	}, [onError, refreshPreview, stop]);

	// Leaving the page mid-recording releases the microphone.
	useEffect(
		() => () => {
			const current = session.current;
			session.current = null;
			if (!current) return;
			for (const timer of current.timers) window.clearInterval(timer);
			current.capture.stop();
			current.live?.abort();
			preview.current?.abort();
		},
		[],
	);

	return { state, seconds, levels, liveText, start, stop };
}
