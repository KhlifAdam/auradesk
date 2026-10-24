import { describe, expect, it } from "vitest";
import {
	downsample,
	encodeWav,
	hasSpeech,
	joinChunks,
	SPEECH_RATE,
	toSpeechWav,
	trimSilence,
} from "@/lib/audio/pcm";

const tone = (seconds: number, rate: number, amplitude: number) =>
	Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) =>
		Math.sin((2 * Math.PI * 220 * i) / rate) * amplitude,
	);

describe("voice recording helpers", () => {
	it("joins chunks in order", () => {
		const joined = joinChunks([Float32Array.of(1, 2), Float32Array.of(3)]);
		expect(Array.from(joined)).toEqual([1, 2, 3]);
	});

	it("lowers 48 kHz to 16 kHz without changing the duration", () => {
		const out = downsample(tone(2, 48_000, 0.5), 48_000);
		expect(out.length).toBe(2 * SPEECH_RATE);
	});

	it("leaves audio that is already slow enough alone", () => {
		const input = tone(1, 8_000, 0.5);
		expect(downsample(input, 8_000)).toBe(input);
	});

	it("hears a voice but not room noise or silence", () => {
		expect(hasSpeech(tone(1, 16_000, 0.3), 16_000)).toBe(true);
		expect(hasSpeech(tone(1, 16_000, 0.003), 16_000)).toBe(false);
		expect(hasSpeech(new Float32Array(16_000), 16_000)).toBe(false);
	});

	it("ignores a click shorter than a syllable", () => {
		const click = new Float32Array(16_000);
		click.fill(0.5, 100, 400);
		expect(hasSpeech(click, 16_000)).toBe(false);
	});

	it("never sends a recording where nobody spoke", () => {
		expect(toSpeechWav([new Float32Array(48_000)], 48_000)).toBeNull();
	});

	it("writes a valid 16-bit mono WAV", async () => {
		const wav = await encodeWav(tone(1, 16_000, 0.5), 16_000).arrayBuffer();
		const view = new DataView(wav);
		const text = (at: number) =>
			String.fromCharCode(...new Uint8Array(wav, at, 4));
		expect([text(0), text(8), text(36)]).toEqual(["RIFF", "WAVE", "data"]);
		expect(view.getUint16(22, true)).toBe(1);
		expect(view.getUint32(24, true)).toBe(16_000);
		expect(wav.byteLength).toBe(44 + 16_000 * 2);
	});

	it("keeps a minute of speech under the upload limit", async () => {
		const wav = toSpeechWav([tone(60, 48_000, 0.3)], 48_000);
		expect(wav?.size).toBeLessThan(3_000_000);
	});
});

describe("silence around the words", () => {
	const speech = tone(1, 16_000, 0.3);
	const quiet = (seconds: number) =>
		Float32Array.from({ length: seconds * 16_000 }, () => (Math.random() - 0.5) * 0.004);

	it("cuts the quiet before and after, keeping a little around the words", () => {
		const recording = joinChunks([quiet(2), speech, quiet(3)]);
		const trimmed = trimSilence(recording, 16_000);
		// One second of speech plus about a quarter second kept on each side.
		expect(trimmed.length).toBeGreaterThan(16_000);
		expect(trimmed.length).toBeLessThan(16_000 * 1.7);
	});

	it("leaves a recording alone when it is all speech", () => {
		expect(trimSilence(speech, 16_000).length).toBe(speech.length);
	});

	it("trims a recording that ends in silence before it is sent", async () => {
		const wav = toSpeechWav([joinChunks([speech, quiet(3)])], 16_000);
		expect((await wav!.arrayBuffer()).byteLength).toBeLessThan(44 + 16_000 * 2 * 1.5);
	});
});
