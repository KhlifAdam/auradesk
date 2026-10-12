import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);

/** A new shot when this share of the picture changes between two frames. */
const SCENE_THRESHOLD = 0.35;
/** Cuts closer than this are flashes or camera shake, not new shots. */
const MIN_SHOT_SEC = 1;
/** Quieter than this for at least `SILENCE_MIN_SEC` counts as silence. */
const SILENCE_NOISE = "-35dB";
const SILENCE_MIN_SEC = 1.5;
const FRAME_WIDTH = 512;
const MAX_OUTPUT = 64 * 1024 * 1024;

export interface Silence {
	start: number;
	end: number;
}

export interface VideoMetrics {
	durationSec: number;
	hasAudio: boolean;
	sceneCuts: number[];
	silences: Silence[];
	silenceRatio: number;
}

function binary() {
	if (!ffmpegPath) throw new Error("ffmpeg is not available");
	return ffmpegPath;
}

/** ffmpeg writes its report on stderr; a failed probe still prints it. */
async function stderrOf(args: string[]) {
	try {
		const { stderr } = await run(binary(), args, { maxBuffer: MAX_OUTPUT });
		return stderr;
	} catch (error) {
		const stderr = (error as { stderr?: string }).stderr;
		if (typeof stderr === "string" && stderr.includes("Duration"))
			return stderr;
		throw error;
	}
}

function parseDuration(report: string) {
	const match = report.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
	if (!match) throw new Error("Unreadable video");
	const [, h, m, s] = match;
	return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function parseSceneCuts(report: string) {
	const cuts: number[] = [];
	for (const match of report.matchAll(/pts_time:(\d+(?:\.\d+)?)/g)) {
		const time = Number(match[1]);
		if (time - (cuts.at(-1) ?? 0) >= MIN_SHOT_SEC) cuts.push(time);
	}
	return cuts;
}

function parseSilences(report: string, duration: number): Silence[] {
	const silences: Silence[] = [];
	let start: number | null = null;
	for (const line of report.split("\n")) {
		const opened = line.match(/silence_start: (-?\d+(?:\.\d+)?)/);
		if (opened) start = Math.max(0, Number(opened[1]));
		const closed = line.match(/silence_end: (\d+(?:\.\d+)?)/);
		if (closed && start !== null) {
			silences.push({ start, end: Number(closed[1]) });
			start = null;
		}
	}
	// Silent until the very end: ffmpeg never prints the closing mark.
	if (start !== null) silences.push({ start, end: duration });
	return silences;
}

/**
 * Shot changes and silent stretches of a video, in one low-resolution pass.
 * `input` is a file path or a URL (a signed link to the stored file).
 */
export async function measureVideo(input: string): Promise<VideoMetrics> {
	const probe = await stderrOf(["-hide_banner", "-i", input]);
	const durationSec = parseDuration(probe);
	const hasAudio = /Stream #\S+.*Audio:/.test(probe);

	const report = await stderrOf([
		"-hide_banner",
		"-nostats",
		"-i",
		input,
		"-vf",
		`scale=160:-2,select='gt(scene,${SCENE_THRESHOLD})',showinfo`,
		...(hasAudio
			? ["-af", `silencedetect=noise=${SILENCE_NOISE}:d=${SILENCE_MIN_SEC}`]
			: ["-an"]),
		"-f",
		"null",
		"-",
	]);
	const silences = hasAudio
		? parseSilences(report, durationSec)
		: [{ start: 0, end: durationSec }];
	const silent = silences.reduce((sum, s) => sum + (s.end - s.start), 0);

	return {
		durationSec,
		hasAudio,
		sceneCuts: parseSceneCuts(report),
		silences,
		silenceRatio: durationSec > 0 ? Math.min(1, silent / durationSec) : 0,
	};
}

/** JPEG stills at the given moments, to show a vision model what the clip is. */
export async function grabFrames(input: string, times: number[]) {
	return Promise.all(
		times.map(async (time) => {
			const { stdout } = await run(
				binary(),
				[
					"-hide_banner",
					"-loglevel",
					"error",
					"-ss",
					time.toFixed(2),
					"-i",
					input,
					"-frames:v",
					"1",
					"-vf",
					`scale=${FRAME_WIDTH}:-2`,
					"-f",
					"image2pipe",
					"-vcodec",
					"mjpeg",
					"-",
				],
				{ encoding: "buffer", maxBuffer: MAX_OUTPUT },
			);
			return stdout;
		}),
	);
}
