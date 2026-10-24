/** Speech needs no more: 16 kHz mono keeps a minute of audio under 2 MB. */
export const SPEECH_RATE = 16_000;

const FRAME_MS = 50;
/** Quieter than this is room noise, not a voice. */
const SPEECH_RMS = 0.015;
/** Speech needs at least this many loud frames; a click or a cough is less. */
const MIN_SPEECH_FRAMES = 6;

export function joinChunks(chunks: Float32Array[]) {
	const out = new Float32Array(chunks.reduce((sum, c) => sum + c.length, 0));
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.length;
	}
	return out;
}

/** Lowers the sample rate by averaging, which also softens aliasing. */
export function downsample(
	samples: Float32Array,
	fromRate: number,
	toRate = SPEECH_RATE,
) {
	if (fromRate <= toRate) return samples;
	const ratio = fromRate / toRate;
	const out = new Float32Array(Math.floor(samples.length / ratio));
	for (let i = 0; i < out.length; i++) {
		const start = Math.floor(i * ratio);
		const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
		let sum = 0;
		for (let j = start; j < end; j++) sum += samples[j];
		out[i] = sum / Math.max(1, end - start);
	}
	return out;
}

/**
 * Lowers the rate of audio that arrives in pieces. It remembers exactly where
 * the next output sample starts, so pieces join up with no drift or clicks.
 */
export function createDownsampler(fromRate: number, toRate = SPEECH_RATE) {
	if (fromRate <= toRate) return (chunk: Float32Array) => chunk;
	const ratio = fromRate / toRate;
	let carry = new Float32Array(0);
	/** Where the next output sample starts, in input samples from `carry`. */
	let pos = 0;
	return (chunk: Float32Array) => {
		const input = joinChunks([carry, chunk]);
		const out: number[] = [];
		while (Math.floor(pos + ratio) <= input.length) {
			const start = Math.floor(pos);
			const end = Math.floor(pos + ratio);
			let sum = 0;
			for (let i = start; i < end; i++) sum += input[i];
			out.push(sum / (end - start));
			pos += ratio;
		}
		const used = Math.floor(pos);
		carry = input.slice(used);
		pos -= used;
		return Float32Array.from(out);
	};
}

/** Raw 16-bit little-endian samples, as streaming speech services expect. */
export function floatToPcm16(samples: Float32Array) {
	const out = new Int16Array(samples.length);
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
	}
	return out.buffer;
}

/**
 * Whether anyone spoke. Models invent words for silence ("Thank you."), so
 * a recording without speech is never sent.
 */
export function hasSpeech(samples: Float32Array, rate: number) {
	const frame = Math.max(1, Math.floor((rate * FRAME_MS) / 1000));
	let loud = 0;
	for (let start = 0; start + frame <= samples.length; start += frame) {
		let energy = 0;
		for (let i = start; i < start + frame; i++) energy += samples[i] ** 2;
		if (Math.sqrt(energy / frame) > SPEECH_RMS && ++loud >= MIN_SPEECH_FRAMES)
			return true;
	}
	return false;
}

/** Quiet kept around the words, so the first and last sounds aren't clipped. */
const TRIM_PADDING_MS = 250;
/** Even a very quiet room is never treated as quieter than this. */
const MIN_TRIM_RMS = 0.008;

/**
 * Cuts the silence before and after the words. Models invent a closing line
 * ("Thank you.", "...") for a recording that ends in quiet, and the recording
 * always runs a moment past the last word. The speech threshold follows the
 * room: three times its background level, so a noisy room trims too.
 */
export function trimSilence(samples: Float32Array, rate: number) {
	const frame = Math.max(1, Math.floor((rate * FRAME_MS) / 1000));
	const rms: number[] = [];
	for (let start = 0; start + frame <= samples.length; start += frame) {
		let energy = 0;
		for (let i = start; i < start + frame; i++) energy += samples[i] ** 2;
		rms.push(Math.sqrt(energy / frame));
	}
	if (rms.length === 0) return samples;
	const quietest = [...rms].sort((a, b) => a - b);
	const room = quietest[Math.floor(quietest.length * 0.2)];
	const threshold = Math.max(MIN_TRIM_RMS, room * 3);

	const first = rms.findIndex((level) => level > threshold);
	const last = rms.findLastIndex((level) => level > threshold);
	if (first === -1) return samples;
	const padding = Math.floor((rate * TRIM_PADDING_MS) / 1000);
	return samples.subarray(
		Math.max(0, first * frame - padding),
		Math.min(samples.length, (last + 1) * frame + padding),
	);
}

/** 16-bit mono WAV, the one format every transcription model accepts. */
export function encodeWav(samples: Float32Array, sampleRate: number) {
	const dataSize = samples.length * 2;
	const view = new DataView(new ArrayBuffer(44 + dataSize));
	const text = (offset: number, value: string) => {
		for (let i = 0; i < value.length; i++)
			view.setUint8(offset + i, value.charCodeAt(i));
	};
	text(0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	text(8, "WAVE");
	text(12, "fmt ");
	view.setUint32(16, 16, true); // PCM chunk size
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true); // bytes per second
	view.setUint16(32, 2, true); // block align
	view.setUint16(34, 16, true); // bits per sample
	text(36, "data");
	view.setUint32(40, dataSize, true);
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
	}
	return new Blob([view], { type: "audio/wav" });
}

/** The recorded chunks as a speech WAV without the silence around the words, or null when nobody spoke. */
export function toSpeechWav(chunks: Float32Array[], inputRate: number) {
	const samples = joinChunks(chunks);
	if (!hasSpeech(samples, inputRate)) return null;
	const spoken = trimSilence(samples, inputRate);
	return encodeWav(downsample(spoken, inputRate), SPEECH_RATE);
}
