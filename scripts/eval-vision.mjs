// Compares vision models on the two tasks the assistants rely on, with the
// same prompts, image sizes and output schemas as the app.
//   pnpm eval:vision <dataset-dir> [runs]
// <dataset-dir>/photos/yeux-fermes/**.jpg   photos where someone blinked
// <dataset-dir>/photos/yeux-ouverts/**.jpg  photos where nobody did
// <dataset-dir>/clips/<CATEGORY>/**.mp4     clips sorted by expected category
// Writes <dataset-dir>/results.json and prints the tables for the report.
// Env: EVAL_LIMIT=n caps files per folder (a cheap trial run); EVAL_MODELS=a,b picks models;
// EVAL_EDGE=px sets the photo size; EVAL_ONLY=eyes skips clips; EVAL_OUT=file names the output;
// EVAL_BASE_URL / EVAL_API_KEY point it at another OpenAI-compatible server (e.g. Ollama).

import { execFile } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import OpenAI from "openai";
import sharp from "sharp";

// Open-weight models in two sizes per family, plus one closed model as a reference.
const MODELS = process.env.EVAL_MODELS?.split(",") ?? [
	"google/gemma-3-12b-it",
	"google/gemma-4-26b-a4b-it",
	"mistralai/ministral-8b-2512",
	"mistralai/mistral-small-3.2-24b-instruct",
	"qwen/qwen3-vl-8b-instruct",
	"qwen/qwen3-vl-30b-a3b-instruct",
	"google/gemini-2.5-flash-lite",
];
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
// The same prompt with the allowed categories spelled out. Many open-model hosts enforce the
// JSON schema without showing it to the model, so the enum alone leaves it guessing.
const CLIP_PROMPT_LISTED = `${CLIP_PROMPT}\nThe category must be one of: ${CATEGORIES.join(", ")}.`;
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
const runs = Number(process.argv[3] ?? 1);
const limit = Number(process.env.EVAL_LIMIT ?? Infinity);
// Longest photo edge sent to the model; 768 matches VISION_EDGE in src/lib/ai/eyes-check.ts.
const edge = Number(process.env.EVAL_EDGE ?? 768);
const eyesOnly = process.env.EVAL_ONLY === "eyes";
const apiKey = process.env.EVAL_API_KEY ?? process.env.OPENROUTER_API_KEY;
if (!dir || !apiKey) {
	console.error("Usage: pnpm eval:vision <dataset-dir> [runs]  (needs OPENROUTER_API_KEY)");
	process.exit(1);
}
const client = new OpenAI({ apiKey, baseURL: process.env.EVAL_BASE_URL ?? "https://openrouter.ai/api/v1" });
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
			// OpenRouter: only providers that honour the JSON schema and don't keep the data.
			provider: { require_parameters: true, data_collection: "deny" },
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
	// Recursive, so downloaded/ subfolders count alongside the photographer's own files.
	return (await readdir(path, { withFileTypes: true, recursive: true }).catch(() => []))
		.filter((f) => f.isFile() && /\.(jpe?g|png|webp|mp4|mov|webm)$/i.test(f.name))
		.map((f) => join(f.parentPath, f.name))
		.sort()
		.slice(0, limit);
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
		const small = await sharp(photo.path).rotate().resize(edge, edge, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
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
	const said = (c) => (c.reply ? c.reply.faces > 0 && c.reply.eyesClosed : null);
	const right = (c) => said(c) === c.photo.closed;
	// The photographer's own photos vs the downloaded stock ones, to spot a bias between them.
	const share = (xs) => (xs.length ? xs.filter(right).length / xs.length : null);
	const mine = calls.filter((c) => !c.photo.path.includes("downloaded"));
	return {
		photos: photos.length, calls: calls.length, tp, fp, fn, tn,
		accuracy: (tp + tn) / calls.length,
		accuracyOwnPhotos: share(mine),
		accuracyDownloaded: share(calls.filter((c) => !mine.includes(c))),
		precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
		schemaValid: calls.filter((c) => c.reply).length / calls.length,
		consistency: agree / photos.length,
		medianSeconds: median(calls.map((c) => c.ms)) / 1000,
		costPer1000: (1000 * calls.reduce((s, c) => s + c.cost, 0)) / calls.length,
		totalCost: calls.reduce((s, c) => s + c.cost, 0),
		errors: calls.filter((c) => c.error).map((c) => c.error).slice(0, 3),
		mistakes: calls.filter((c) => !right(c)).map((c) => ({
			file: relative(dir, c.photo.path),
			expected: c.photo.closed ? "closed" : "open",
			got: c.reply ? `${said(c) ? "closed" : "open"} (${c.reply.faces} faces)` : "invalid reply",
		})),
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

let clipCache;
/** The clips and their 3 stills, extracted once and shared by every model. */
async function loadClips() {
	if (clipCache) return clipCache;
	clipCache = [];
	for (const category of CATEGORIES)
		for (const path of await files(join(dir, "clips", category))) clipCache.push({ path, category, stills: await frames(path) });
	return clipCache;
}

async function evalClips(model, prompt) {
	const clips = await loadClips();
	if (!clips.length) return null;
	const valid = (r) => CATEGORIES.includes(r?.category) && typeof r?.summary === "string";
	const jobs = clips.flatMap((clip) => Array.from({ length: runs }, () => async () =>
		({ clip, ...(await ask(model, "clip_label", CLIP_SCHEMA, [...clip.stills.map(jpeg), { type: "text", text: prompt }], valid)) })));
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
		totalCost: calls.reduce((s, c) => s + c.cost, 0),
		errors: calls.filter((c) => c.error).map((c) => c.error).slice(0, 3),
		mistakes: calls.filter((c) => c.reply?.category !== c.clip.category)
			.map((c) => ({ file: relative(dir, c.clip.path), expected: c.clip.category, got: c.reply?.category ?? "invalid reply" })),
		summaries: clips.map((clip) => ({ clip: relative(dir, clip.path), summary: calls.find((c) => c.clip === clip && c.reply)?.reply.summary ?? null })),
	};
}

const results = { date: new Date().toISOString(), runs, photoEdge: edge, models: {} };
for (const model of MODELS) {
	console.log(`… ${model}`);
	const eyes = await evalEyes(model);
	results.models[model] = eyesOnly
		? { eyes }
		: { eyes, clips: await evalClips(model, CLIP_PROMPT), clipsListed: await evalClips(model, CLIP_PROMPT_LISTED) };
}
await writeFile(join(dir, process.env.EVAL_OUT ?? "results.json"), JSON.stringify(results, null, 2));

// Consistency only means something when each photo was sent more than once.
const constancy = runs > 1 ? " | constance" : "";
console.log(`\nYeux fermés : modèle | exactitude | précision | rappel | F1 | schéma valide${constancy} | latence médiane (s) | coût / 1000 (USD)`);
for (const [m, r] of Object.entries(results.models)) {
	const e = r.eyes;
	const c = runs > 1 ? ` | ${pct(e.consistency)}` : "";
	console.log(`${m} | ${pct(e.accuracy)} | ${pct(e.precision)} | ${pct(e.recall)} | ${pct(e.f1)} | ${pct(e.schemaValid)}${c} | ${e.medianSeconds.toFixed(2)} | ${e.costPer1000.toFixed(3)}`);
}
for (const [key, title] of [["clips", "prompt de l'app"], ["clipsListed", "catégories listées"]]) {
	console.log(`\nClips (${title}) : modèle | exactitude | F1 macro | schéma valide | latence médiane (s) | coût / 1000 (USD)`);
	for (const [m, r] of Object.entries(results.models)) {
		const c = r[key];
		if (c) console.log(`${m} | ${pct(c.accuracy)} | ${pct(c.macroF1)} | ${pct(c.schemaValid)} | ${c.medianSeconds.toFixed(2)} | ${c.costPer1000.toFixed(3)}`);
	}
}
const spent = Object.values(results.models).reduce((s, r) => s + r.eyes.totalCost + (r.clips?.totalCost ?? 0) + (r.clipsListed?.totalCost ?? 0), 0);
console.log(`\nCoût total : $${spent.toFixed(4)}`);
