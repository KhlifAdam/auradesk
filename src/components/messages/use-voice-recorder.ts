"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VOICE_MAX_MS } from "@/services/messages/attachments";

/** Opus in WebM where supported (Chrome, Firefox), MP4/AAC on Safari. */
const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

export interface VoiceRecording {
	blob: Blob;
	durationMs: number;
	filename: string;
}

type RecorderState = "idle" | "recording" | "denied" | "unsupported";

/**
 * Records a voice message from the microphone. `stop` resolves with the
 * recording; `cancel` throws it away. Stops on its own at the length limit.
 */
export function useVoiceRecorder(onLimit: (recording: VoiceRecording) => void) {
	const [state, setState] = useState<RecorderState>("idle");
	const [elapsed, setElapsed] = useState(0);
	const recorder = useRef<MediaRecorder | null>(null);
	const chunks = useRef<Blob[]>([]);
	const startedAt = useRef(0);
	const finish = useRef<((recording: VoiceRecording | null) => void) | null>(
		null,
	);
	const keep = useRef(true);

	const release = useCallback(() => {
		for (const track of recorder.current?.stream.getTracks() ?? [])
			track.stop();
		recorder.current = null;
	}, []);

	// Leaving the page mid-recording frees the microphone.
	useEffect(() => release, [release]);

	useEffect(() => {
		if (state !== "recording") return;
		const timer = window.setInterval(() => {
			const ms = Date.now() - startedAt.current;
			setElapsed(ms);
			if (ms >= VOICE_MAX_MS)
				stopRecording().then((recording) => recording && onLimit(recording));
		}, 200);
		return () => window.clearInterval(timer);
	});

	async function start() {
		if (
			typeof MediaRecorder === "undefined" ||
			!navigator.mediaDevices?.getUserMedia
		)
			return setState("unsupported");
		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			return setState("denied");
		}
		const mimeType = PREFERRED_TYPES.find((type) =>
			MediaRecorder.isTypeSupported(type),
		);
		const media = new MediaRecorder(stream, mimeType ? { mimeType } : {});
		chunks.current = [];
		keep.current = true;
		media.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.current.push(event.data);
		};
		media.onstop = () => {
			const durationMs = Date.now() - startedAt.current;
			const type = media.mimeType || mimeType || "audio/webm";
			const blob = new Blob(chunks.current, { type: type.split(";")[0] });
			const extension = type.includes("mp4") ? "m4a" : "webm";
			release();
			// The length stays shown while the message is being sent.
			setElapsed(durationMs);
			setState("idle");
			finish.current?.(
				keep.current && blob.size > 0
					? { blob, durationMs, filename: `voice-message.${extension}` }
					: null,
			);
			finish.current = null;
		};
		recorder.current = media;
		startedAt.current = Date.now();
		setElapsed(0);
		media.start(250);
		setState("recording");
	}

	function stopRecording() {
		return new Promise<VoiceRecording | null>((resolve) => {
			if (!recorder.current || recorder.current.state === "inactive")
				return resolve(null);
			finish.current = resolve;
			recorder.current.stop();
		});
	}

	function cancel() {
		keep.current = false;
		void stopRecording();
	}

	const reset = useCallback(() => setState("idle"), []);

	return {
		state,
		elapsed,
		start,
		stop: stopRecording,
		cancel,
		reset,
	};
}
