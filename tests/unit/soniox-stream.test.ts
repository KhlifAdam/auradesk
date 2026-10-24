import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDownsampler, floatToPcm16 } from "@/lib/audio/pcm";
import { openLiveSpeech } from "@/lib/audio/soniox-stream";

/** Stands in for the browser's WebSocket and records what the app sends. */
class FakeSocket {
	static last: FakeSocket;
	binaryType = "";
	sent: (string | ArrayBuffer)[] = [];
	closed = false;
	onopen: () => void = () => {};
	onmessage: (event: { data: string }) => void = () => {};
	onerror: () => void = () => {};
	onclose: () => void = () => {};
	constructor(
		public url: string,
		public protocols: string[],
	) {
		FakeSocket.last = this;
	}
	send(data: string | ArrayBuffer) {
		this.sent.push(data);
	}
	close() {
		this.closed = true;
		this.onclose();
	}
	reply(message: object) {
		this.onmessage({ data: JSON.stringify(message) });
	}
}

beforeEach(() => {
	vi.stubGlobal("WebSocket", FakeSocket);
});
afterEach(() => vi.unstubAllGlobals());

const samples = (n: number) => new Float32Array(n).fill(0.1);
const word = (text: string, is_final: boolean) => ({ text, is_final });

describe("live speech stream", () => {
	it("connects with the one-use key and sends the start message first", () => {
		openLiveSpeech("temp-key", { onText: vi.fn(), onFailure: vi.fn() });
		const socket = FakeSocket.last;
		expect(socket.url).toBe("wss://stt-rt.soniox.com/transcribe-websocket");
		expect(socket.protocols).toEqual(["soniox-api-key", "temp-key"]);
		socket.onopen();
		expect(JSON.parse(socket.sent[0] as string)).toMatchObject({
			model: "stt-rt-v5",
			audio_format: "pcm_s16le",
			sample_rate: 16_000,
			num_channels: 1,
		});
		// No key in the message: it travels in the connection itself.
		expect(socket.sent[0]).not.toContain("api_key");
	});

	it("holds audio until the connection is open, then sends it in order", () => {
		const live = openLiveSpeech("k", { onText: vi.fn(), onFailure: vi.fn() });
		live.send(samples(4800), 48_000);
		live.send(samples(4800), 48_000);
		const socket = FakeSocket.last;
		expect(socket.sent).toHaveLength(0);
		socket.onopen();
		expect(socket.sent).toHaveLength(3); // start message + two audio frames
		expect((socket.sent[1] as ArrayBuffer).byteLength).toBe(1600 * 2);
	});

	it("shows final words plus the latest guess for the rest", () => {
		const onText = vi.fn();
		openLiveSpeech("k", { onText, onFailure: vi.fn() });
		const socket = FakeSocket.last;
		socket.onopen();
		socket.reply({ tokens: [word("Bonjour", true), word(" le", false)] });
		expect(onText).toHaveBeenLastCalledWith("Bonjour le");
		// The guess is replaced, not added to.
		socket.reply({ tokens: [word(" mon", true), word("de", false)] });
		expect(onText).toHaveBeenLastCalledWith("Bonjour monde");
		socket.reply({ tokens: [word("de", true), word(" !", false)] });
		expect(onText).toHaveBeenLastCalledWith("Bonjour monde !");
	});

	it("ignores markers that aren't words", () => {
		const onText = vi.fn();
		openLiveSpeech("k", { onText, onFailure: vi.fn() });
		FakeSocket.last.onopen();
		FakeSocket.last.reply({ tokens: [word("Salut", true), word("<end>", true)] });
		expect(onText).toHaveBeenLastCalledWith("Salut");
	});

	it("ends the stream with an empty text frame and returns the full text", async () => {
		const live = openLiveSpeech("k", { onText: vi.fn(), onFailure: vi.fn() });
		const socket = FakeSocket.last;
		socket.onopen();
		socket.reply({ tokens: [word("Fini", false)] });
		const result = live.finish();
		expect(socket.sent.at(-1)).toBe("");
		socket.reply({ tokens: [word("Fini", true)] });
		socket.reply({ tokens: [], finished: true });
		await expect(result).resolves.toBe("Fini");
		expect(socket.closed).toBe(true);
	});

	it("still finishes when stopped before the connection opened", async () => {
		const live = openLiveSpeech("k", { onText: vi.fn(), onFailure: vi.fn() });
		const socket = FakeSocket.last;
		const result = live.finish();
		socket.onopen();
		expect(socket.sent.at(-1)).toBe("");
		socket.reply({ tokens: [], finished: true });
		await expect(result).resolves.toBe("");
	});

	it("reports an error frame and gives up", () => {
		const onFailure = vi.fn();
		openLiveSpeech("bad", { onText: vi.fn(), onFailure });
		FakeSocket.last.onopen();
		FakeSocket.last.reply({ error_code: 401, error_type: "unauthenticated" });
		expect(onFailure).toHaveBeenCalledOnce();
		expect(FakeSocket.last.closed).toBe(true);
	});
});

describe("streaming audio conversion", () => {
	it("keeps the sample count right across pieces, without drift", () => {
		const down = createDownsampler(44_100);
		let total = 0;
		for (let i = 0; i < 100; i++) total += down(samples(4096)).length;
		// 100 pieces of 4096 samples at 44.1 kHz, as 16 kHz, give 148 608 samples.
		expect(Math.abs(total - (100 * 4096 * 16_000) / 44_100)).toBeLessThan(3);
	});

	it("passes slow audio through untouched", () => {
		expect(createDownsampler(16_000)(samples(100))).toHaveLength(100);
	});

	it("writes 16-bit little-endian samples, clipped", () => {
		const view = new Int16Array(floatToPcm16(Float32Array.of(0, 1, -1, 2)));
		expect(Array.from(view)).toEqual([0, 32767, -32768, 32767]);
	});
});
