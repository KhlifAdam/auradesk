// Compares vision models on the two tasks the assistants rely on, with the
// same prompts, image sizes and output schemas as the app.
//   pnpm eval:vision <dataset-dir> [runs]
// <dataset-dir>/photos/yeux-fermes/*.jpg   photos where someone blinked
// <dataset-dir>/photos/yeux-ouverts/*.jpg  photos where nobody did
// <dataset-dir>/clips/<CATEGORY>/*.mp4     clips sorted by expected category
// Writes <dataset-dir>/results.json and prints the tables for the report.

import { execFile } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import OpenAI from "openai";
import sharp from "sharp";

const MODELS = ["google/gemma-3-12b-it", "google/gemini-2.5-flash-lite", "openai/gpt-4.1-mini"];
const CATEGORIES = ["CEREMONY", "SPEECH", "DANCE", "PORTRAIT", "GROUP", "DETAILS", "LANDSCAPE", "PRODUCT", "BEHIND_THE_SCENES", "OTHER"];
const PARALLEL = 4;

// Same prompts as src/lib/ai/eyes-check.ts and src/lib/ai/video-classify.ts.
const EYES_PROMPT = `You review photos for a professional photographer who is culling a shoot.
Count the people whose faces are clearly visible, and say whether any of them
has their eyes closed or caught mid-blink. Ignore faces that are tiny, turned
away or deliberately looking down (e.g. reading), since those aren't mistakes.`;
const CLIP_PROMPT = `These are stills taken at the start, middle and end of one video clip
filmed by a professional photographer/videographer (weddings, events, products,
portraits, corporate work). Pick the category that best describes the clip so
the editor can find it quickly, and write one short sentence (under 20 words,
in French) saying what happens in it.`;
const EYES_SCHEMA = {
	type: "object",
	properties: { faces: { type: "integer", minimum: 0 }, eyesClosed: { type: "boolean" } },
	required: ["faces", "eyesClosed"],
	additionalProperties: false,
};
const CLIP_SCHEMA = {
	type: "object",
	properties: { category: { type: "string", enum: CATEGORIES }, summary: { type: "string" } },
	required: ["category", "summary"],
	additionalProperties: false,
};

process.loadEnvFile(".env");
const dir = process.argv[2];
const runs = Number(process.argv[3] ?? 3);
if (!dir || !process.env.OPENROUTER_API_KEY) {
	console.error("Usage: pnpm eval:vision <dataset-dir> [runs]  (needs OPENROUTER_API_KEY)");
	process.exit(1);
}
const client = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });
const run = promisify(execFile);
const jpeg = (buffer) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${buffer.toString("base64")}` } });

/** One call: the parsed reply (or null), its latency and its cost in USD. */
async function ask(model, name, schema, content, valid) {
	const started = performance.now();
	try {
		const response = await client.chat.completions.create({
			model,
			temperature: 0,
			max_tokens: 1024,
			messages: [{ role: "user", content }],
			response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
			usage: { include: true },
		});
		const ms = performance.now() - started;
		const cost = response.usage?.cost ?? 0;
		let reply = null;
		try {
			const parsed = JSON.parse(response.choices[0]?.message?.content ?? "");
			reply = valid(parsed) ? parsed : null;
		} catch {}
		return { reply, ms, cost };
	} catch (error) {
		return { reply: null, ms: performance.now() - started, cost: 0, error: String(error.message ?? error) };
	}
}

async function files(path) {
	return (await readdir(path, { withFileTypes: true }).catch(() => [])).filter((f) => f.isFile()).map((f) => join(path, f.name));
}

/** Runs the jobs a few at a time. */
async function pool(jobs) {
	const out = [];
	let next = 0;
	await Promise.all(Array.from({ length: PARALLEL }, async () => {
		while (next < jobs.length) {
			const i = next++;
			out[i] = await jobs[i]();
		}
	}));
	return out;
}

const median = (xs) => {
	const s = [...xs].sort((a, b) => a - b);
	return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};
const pct = (x) => (100 * x).toFixed(1);

async function evalEyes(model) {
	const photos = [
		...(await files(join(dir, "photos", "yeux-fermes"))).map((path) => ({ path, closed: true })),
		...(await files(join(dir, "photos", "yeux-ouverts"))).map((path) => ({ path, closed: false })),
	];
	const valid = (r) => Number.isInteger(r?.faces) && typeof r?.eyesClosed === "boolean";
	const jobs = [];
	for (const photo of photos) {
		const small = await sharp(photo.path).rotate().resize(768, 768, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
		for (let r = 0; r < runs; r++)
			jobs.push(async () => ({ photo, ...(await ask(model, "face_check", EYES_SCHEMA, [jpeg(small), { type: "text", text: EYES_PROMPT }], valid)) }));
	}
	const calls = await pool(jobs);
	let tp = 0, fp = 0, fn = 0, tn = 0;
	for (const c of calls) {
		if (!c.reply) { if (c.photo.closed) fn++; continue; } // an invalid reply flags nothing
		const said = c.reply.faces > 0 && c.reply.eyesClosed;
		if (said && c.photo.closed) tp++;
		else if (said) fp++;
		else if (c.photo.closed) fn++;
		else tn++;
	}
	const precision = tp + fp ? tp / (tp + fp) : 0;
	const recall = tp + fn ? tp / (tp + fn) : 0;
	const agree = photos.filter((p) => {
		const own = calls.filter((c) => c.photo === p).map((c) => (c.reply ? c.reply.faces > 0 && c.reply.eyesClosed : "x"));
		return own.every((v) => v === own[0]);
	}).length;
	return {
		photos: photos.length, calls: calls.length, tp, fp, fn, tn,
		precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
		schemaValid: calls.filter((c) => c.reply).length / calls.length,
		consistency: agree / photos.length,
		medianSeconds: median(calls.map((c) => c.ms)) / 1000,
		costPer1000: (1000 * calls.reduce((s, c) => s + c.cost, 0)) / calls.length,
		errors: calls.filter((c) => c.error).map((c) => c.error).slice(0, 3),
	};
}

async function frames(path) {
	const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]);
	const duration = Number(stdout.trim());
	return Promise.all([0.15, 0.5, 0.85].map(async (share) => {
		const { stdout: jpg } = await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-ss", (share * duration).toFixed(2), "-i", path,
			"-frames:v", "1", "-vf", "scale=512:-2", "-f", "image2pipe", "-vcodec", "mjpeg", "-"], { encoding: "buffer", maxBuffer: 20e6 });
		return jpg;
	}));
}

async function evalClips(model) {
	const clips = [];
	for (const category of CATEGORIES)
		for (const path of await files(join(dir, "clips", category))) clips.push({ path, category, stills: await frames(path) });
	if (!clips.length) return null;
	const valid = (r) => CATEGORIES.includes(r?.category) && typeof r?.summary === "string";
	const jobs = clips.flatMap((clip) => Array.from({ length: runs }, () => async () =>
		({ clip, ...(await ask(model, "clip_label", CLIP_SCHEMA, [...clip.stills.map(jpeg), { type: "text", text: CLIP_PROMPT }], valid)) })));
	const calls = await pool(jobs);
	const used = CATEGORIES.filter((c) => clips.some((k) => k.category === c));
	const f1s = used.map((cat) => {
		const tp = calls.filter((c) => c.clip.category === cat && c.reply?.category === cat).length;
		const fp = calls.filter((c) => c.clip.category !== cat && c.reply?.category === cat).length;
		const fn = calls.filter((c) => c.clip.category === cat && c.reply?.category !== cat).length;
		const p = tp + fp ? tp / (tp + fp) : 0;
		const r = tp + fn ? tp / (tp + fn) : 0;
		return p + r ? (2 * p * r) / (p + r) : 0;
	});
	return {
		clips: clips.length, calls: calls.length,
		accuracy: calls.filter((c) => c.reply?.category === c.clip.category).length / calls.length,
		macroF1: f1s.reduce((s, x) => s + x, 0) / f1s.length,
		schemaValid: calls.filter((c) => c.reply).length / calls.length,
		medianSeconds: median(calls.map((c) => c.ms)) / 1000,
		costPer1000: (1000 * calls.reduce((s, c) => s + c.cost, 0)) / calls.length,
		summaries: clips.map((clip) => ({ clip: clip.path, summary: calls.find((c) => c.clip === clip && c.reply)?.reply.summary ?? null })),
	};
}

const results = { date: new Date().toISOString(), runs, models: {} };
for (const model of MODELS) {
	console.log(`… ${model}`);
	results.models[model] = { eyes: await evalEyes(model), clips: await evalClips(model) };
}
await writeFile(join(dir, "results.json"), JSON.stringify(results, null, 2));

console.log("\nYeux fermés : modèle | précision | rappel | F1 | schéma valide | constance | latence médiane (s) | coût / 1000 (USD)");
for (const [m, r] of Object.entries(results.models)) {
	const e = r.eyes;
	console.log(`${m} | ${pct(e.precision)} | ${pct(e.recall)} | ${pct(e.f1)} | ${pct(e.schemaValid)} | ${pct(e.consistency)} | ${e.medianSeconds.toFixed(2)} | ${e.costPer1000.toFixed(3)}`);
}
console.log("\nClips : modèle | exactitude | F1 macro | schéma valide | latence médiane (s) | coût / 1000 (USD)");
for (const [m, r] of Object.entries(results.models)) {
	const c = r.clips;
	if (c) console.log(`${m} | ${pct(c.accuracy)} | ${pct(c.macroF1)} | ${pct(c.schemaValid)} | ${c.medianSeconds.toFixed(2)} | ${c.costPer1000.toFixed(3)}`);
}
