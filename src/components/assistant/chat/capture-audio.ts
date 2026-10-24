/** How many level bars the microphone button draws while recording. */
export const LEVEL_BARS = 5;

export interface AudioCapture {
	/** The microphone's own sample rate (usually 44.1 or 48 kHz). */
	rate: number;
	stop: () => void;
}

/**
 * Opens the microphone and hands over raw samples as they arrive, plus the
 * level bars. Rejects with the browser's error when the microphone is refused.
 */
export async function captureAudio(
	onSamples: (samples: Float32Array) => void,
	onLevels: (levels: number[]) => void,
): Promise<AudioCapture> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const audio = new AudioContext();
	const source = audio.createMediaStreamSource(stream);
	const analyser = audio.createAnalyser();
	analyser.fftSize = 64;
	const bins = new Uint8Array(analyser.frequencyBinCount);
	// Raw samples, so partial recordings are always valid audio.
	const tap = audio.createScriptProcessor(4096, 1, 1);
	const mute = audio.createGain();
	mute.gain.value = 0;
	source.connect(analyser);
	source.connect(tap);
	tap.connect(mute);
	mute.connect(audio.destination);
	tap.onaudioprocess = (event) =>
		onSamples(new Float32Array(event.inputBuffer.getChannelData(0)));

	const meter = window.setInterval(() => {
		analyser.getByteFrequencyData(bins);
		const step = Math.floor(bins.length / LEVEL_BARS);
		onLevels(
			Array.from({ length: LEVEL_BARS }, (_, i) => (bins[i * step] ?? 0) / 255),
		);
	}, 100);

	return {
		rate: audio.sampleRate,
		stop: () => {
			window.clearInterval(meter);
			tap.onaudioprocess = null;
			for (const track of stream.getTracks()) track.stop();
			void audio.close();
		},
	};
}
