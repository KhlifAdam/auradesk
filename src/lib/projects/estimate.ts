/**
 * How long a project still needs, worked out from what is left to do (its
 * stage, its photos and videos), how busy the studio is, and how fast it
 * usually delivers. Pure and explainable: every figure comes with its parts.
 */

import { daysBetween } from "@/lib/money/collect";
import {
	PROJECT_STAGES,
	type ProjectStage,
	stageIndex,
} from "@/services/projects/stages";

export type ServiceType =
	| "WEDDING"
	| "ENGAGEMENT"
	| "BIRTHDAY"
	| "EVENT"
	| "PRODUCT"
	| "PORTRAIT"
	| "ADVERTISING"
	| "CORPORATE"
	| "OTHER";
export type MediaKind = "PHOTO" | "VIDEO" | "BOTH";

/** Typical deliverables when the files aren't uploaded yet: photos and finished video minutes. */
const TYPICAL: Record<ServiceType, { photos: number; videoMin: number }> = {
	WEDDING: { photos: 450, videoMin: 12 },
	ENGAGEMENT: { photos: 80, videoMin: 3 },
	BIRTHDAY: { photos: 150, videoMin: 4 },
	EVENT: { photos: 200, videoMin: 5 },
	PRODUCT: { photos: 40, videoMin: 1 },
	PORTRAIT: { photos: 30, videoMin: 1 },
	ADVERTISING: { photos: 30, videoMin: 1.5 },
	CORPORATE: { photos: 100, videoMin: 3 },
	OTHER: { photos: 100, videoMin: 3 },
};

/** Productive hours a day a studio gives its editing, shared by the projects in progress. */
export const HOURS_PER_DAY = 6;
/** Share of the delivered photos usually kept from the shoot. */
const KEEP_RATE = 0.35;
/** Photos edited an hour: batch editing with presets, not one-by-one retouching. */
const EDITS_PER_HOUR = 60;
/** Days the client takes to pick or approve; a small set is answered faster. */
const WAIT_DAYS = { selection: 2, validation: 1 } as const;
const SMALL_SET = 50;
/** Each other project in editing slows this one a little, up to +50%. */
const WORKLOAD_STEP = 0.1;
const WORKLOAD_CAP = 5;

export const TASKS = [
	"import",
	"culling",
	"retouching",
	"videoEditing",
	"export",
] as const;
export type TaskKey = (typeof TASKS)[number];
export type WaitKey = "shoot" | "selection" | "validation";

/** From which stage each task is still to do (it stays to do until that stage is passed). */
const TASK_UNTIL: Record<TaskKey, ProjectStage> = {
	import: "IMPORT",
	culling: "ORGANIZATION",
	retouching: "POST_PRODUCTION",
	videoEditing: "POST_PRODUCTION",
	export: "EXPORT",
};

export interface EstimateInput {
	stage: ProjectStage;
	serviceType: ServiceType;
	mediaType: MediaKind;
	eventDate: Date | null;
	deliveryDeadline: Date | null;
	media: {
		proofs: number;
		finals: number;
		selected: number;
		videos: number;
	};
	/** The studio's usual days from shoot to delivery, from its past projects. */
	history: { medianDays: number | null; samples: number };
	/** Other projects in the editing stages right now. */
	workload: number;
	today: Date;
}

export interface Estimate {
	done: boolean;
	hoursLeft: number;
	tasks: { key: TaskKey; hours: number }[];
	waits: { key: WaitKey; days: number }[];
	/** Calendar days until it should be finished. */
	daysLeft: number;
	finishDate: string;
	confidence: "low" | "medium" | "high";
	/** Whether the studio's track record was blended in. */
	basis: "work" | "blended";
	deadline: { date: string; slackDays: number; status: DeadlineStatus } | null;
	/** Delivered photos and finished video minutes the estimate assumes. */
	assumed: { photos: number; videoMinutes: number; fromFiles: boolean };
}
export type DeadlineStatus = "onTrack" | "tight" | "late";

const round1 = (n: number) => Math.round(n * 10) / 10;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Adds working days, skipping Sundays. */
export function addWorkDays(from: Date, days: number) {
	const date = new Date(
		Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
	);
	let left = Math.max(0, Math.ceil(days));
	while (left > 0) {
		date.setUTCDate(date.getUTCDate() + 1);
		if (date.getUTCDay() !== 0) left--;
	}
	return date;
}

function volumes(input: EstimateInput) {
	const typical = TYPICAL[input.serviceType];
	const { proofs, finals, selected } = input.media;
	const photosWanted = input.mediaType !== "VIDEO";
	const fromFiles = proofs + finals > 0;
	const photos = !photosWanted
		? 0
		: selected > 0
			? selected
			: finals > 0
				? finals
				: proofs > 0
					? Math.round(proofs * KEEP_RATE)
					: typical.photos;
	const raw = photosWanted ? (proofs > 0 ? proofs : photos / KEEP_RATE) : 0;
	const videoMinutes =
		input.mediaType === "PHOTO"
			? 0
			: typical.videoMin * (input.mediaType === "VIDEO" ? 1.3 : 1);
	return { photos, raw, videoMinutes, fromFiles };
}

function taskHours(
	key: TaskKey,
	v: ReturnType<typeof volumes>,
	videos: number,
) {
	switch (key) {
		case "import":
			return 0.5 + (v.raw + videos * 20) / 2000;
		case "culling":
			return v.raw / 900;
		case "retouching":
			return v.photos / EDITS_PER_HOUR;
		case "videoEditing":
			return v.videoMinutes > 0 ? 2 + v.videoMinutes * 1.5 : 0;
		case "export":
			return 0.5 + v.photos / 1000 + v.videoMinutes * 0.2;
	}
}

export function estimateProject(input: EstimateInput): Estimate {
	const at = stageIndex(input.stage);
	const v = volumes(input);
	const assumed = {
		photos: v.photos,
		videoMinutes: round1(v.videoMinutes),
		fromFiles: v.fromFiles,
	};
	const today = input.today;
	if (input.stage === "DELIVERY")
		return {
			done: true,
			hoursLeft: 0,
			tasks: [],
			waits: [],
			daysLeft: 0,
			finishDate: dayKey(today),
			confidence: "high",
			basis: "work",
			deadline: null,
			assumed,
		};

	const tasks = TASKS.filter((key) => at <= stageIndex(TASK_UNTIL[key]))
		.map((key) => ({
			key,
			hours: round1(taskHours(key, v, input.media.videos)),
		}))
		.filter((task) => task.hours > 0);
	const hoursLeft = round1(tasks.reduce((sum, t) => sum + t.hours, 0));

	const waits: Estimate["waits"] = [];
	const shootIn =
		input.eventDate && at <= stageIndex("SHOOTING")
			? Math.max(0, daysBetween(today, input.eventDate))
			: 0;
	if (shootIn > 0) waits.push({ key: "shoot", days: shootIn });
	const small = v.photos < SMALL_SET;
	if (v.photos > 0 && at <= stageIndex("SELECTION"))
		waits.push({ key: "selection", days: small ? 1 : WAIT_DAYS.selection });
	if (at <= stageIndex("VALIDATION"))
		waits.push({ key: "validation", days: WAIT_DAYS.validation });

	const share =
		1 + Math.min(Math.max(0, input.workload), WORKLOAD_CAP) * WORKLOAD_STEP;
	const workDays = hoursLeft / (HOURS_PER_DAY / share);
	const start = new Date(today.getTime() + shootIn * 86_400_000);
	const waitDays = waits
		.filter((w) => w.key !== "shoot")
		.reduce((sum, w) => sum + w.days, 0);
	let finish = addWorkDays(start, workDays + waitDays);

	// Blend in how long this studio usually takes after a shoot.
	let basis: Estimate["basis"] = "work";
	const { medianDays, samples } = input.history;
	if (medianDays !== null && samples >= 3 && input.eventDate) {
		const usual = new Date(input.eventDate.getTime() + medianDays * 86_400_000);
		if (usual > today) {
			const mid = (finish.getTime() + usual.getTime()) / 2;
			finish = new Date(Math.max(mid, today.getTime() + 86_400_000));
			basis = "blended";
		}
	}

	const known = v.fromFiles || at > stageIndex("SHOOTING");
	const confidence =
		known && samples >= 3 ? "high" : known || samples >= 3 ? "medium" : "low";
	const finishDate = dayKey(finish);
	const deadline = input.deliveryDeadline
		? (() => {
				const slackDays = daysBetween(finish, input.deliveryDeadline);
				const status: DeadlineStatus =
					slackDays < 0 ? "late" : slackDays <= 2 ? "tight" : "onTrack";
				return { date: dayKey(input.deliveryDeadline), slackDays, status };
			})()
		: null;

	return {
		done: false,
		hoursLeft,
		tasks,
		waits,
		daysLeft: Math.max(0, daysBetween(today, finish)),
		finishDate,
		confidence,
		basis,
		deadline,
		assumed,
	};
}

export const EDITING_STAGES: ProjectStage[] = PROJECT_STAGES.slice(
	stageIndex("IMPORT"),
	stageIndex("VALIDATION"),
);
