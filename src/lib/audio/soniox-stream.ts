import { createDownsampler, floatToPcm16, SPEECH_RATE } from "./pcm";

const URL = "wss://stt-rt.soniox.com/transcribe-websocket";
/** How long to wait for the last words after the microphone stops. */
const FINISH_TIMEOUT_MS = 4000;

interface Token {
	text: string;
	is_final?: boolean;
}

interface Message {
	tokens?: Token[];
	finished?: boolean;
	error_code?: number;
}

export interface LiveSpeech {
	/** Feeds microphone samples (at the microphone's own rate). */
	send: (samples: Float32Array, rate: number) => void;
	/** Ends the stream and resolves with the whole text once it settles. */
	finish: () => Promise<string>;
	/** Drops the connection without waiting. */
	abort: () => void;
}

/**
 * A live dictation over Soniox's WebSocket. Words come back while you speak:
 * final ones never change, the rest are replaced by every message, so the
 * text shown is the final words plus the latest guess for the tail.
 * `key` is a one-use browser key from our server.
 */
export function openLiveSpeech(
	key: string,
	handlers: { onText: (text: string) => void; onFailure: () => void },
): LiveSpeech {
	const socket = new WebSocket(URL, ["soniox-api-key", key]);
	socket.binaryType = "arraybuffer";
	let ready = false;
	let finishing = false;
	let finalText = "";
	let latest = "";
	let done: (text: string) => void = () => {};
	const settled = new Promise<string>((resolve) => {
		done = resolve;
	});
	const queue: ArrayBuffer[] = [];
	let downsample: ((chunk: Float32Array) => Float32Array) | null = null;

	const endStream = () => socket.send("");
	socket.onopen = () => {
		socket.send(
			JSON.stringify({
				model: "stt-rt-v5",
				audio_format: "pcm_s16le",
				sample_rate: SPEECH_RATE,
				num_channels: 1,
				// Dictation here is French, English, or a mix of both.
				language_hints: ["fr", "en"],
			}),
		);
		ready = true;
		for (const frame of queue.splice(0)) socket.send(frame);
		if (finishing) endStream();
	};

	socket.onmessage = (event) => {
		const message = JSON.parse(String(event.data)) as Message;
		if (message.error_code) {
			handlers.onFailure();
			done(latest);
			return socket.close();
		}
		let tail = "";
		for (const token of message.tokens ?? []) {
			// Markers like <end> aren't words.
			if (!token.text || /^<.+>$/.test(token.text)) continue;
			if (token.is_final) finalText += token.text;
			else tail += token.text;
		}
		latest = (finalText + tail).trim();
		if (latest) handlers.onText(latest);
		if (message.finished) done(latest);
	};
	socket.onerror = () => {
		handlers.onFailure();
		done(latest);
	};
	socket.onclose = () => done(latest);

	return {
		send(samples, rate) {
			downsample ??= createDownsampler(rate);
			const frame = floatToPcm16(downsample(samples));
			if (ready) socket.send(frame);
			else queue.push(frame);
		},
		async finish() {
			finishing = true;
			if (ready) endStream();
			const timeout = setTimeout(() => done(latest), FINISH_TIMEOUT_MS);
			const text = await settled;
			clearTimeout(timeout);
			socket.close();
			return text;
		},
		abort() {
			done(latest);
			socket.close();
		},
	};
}
