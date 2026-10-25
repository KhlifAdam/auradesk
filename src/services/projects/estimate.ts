import "server-only";

import { db } from "@/lib/db";
import {
	EDITING_STAGES,
	type Estimate,
	estimateProject,
	type ServiceType,
} from "@/lib/projects/estimate";

interface MediaRow {
	project_id: string;
	kind: "PROOFS" | "FINAL";
	type: "IMAGE" | "VIDEO";
	files: bigint;
	selected: bigint;
}

interface HistoryRow {
	service_type: string | null;
	median: number | null;
	samples: bigint;
}

const projectSelect = {
	id: true,
	title: true,
	stage: true,
	serviceType: true,
	mediaType: true,
	eventDate: true,
	deliveryDeadline: true,
	client: { select: { name: true } },
	contactName: true,
} as const;

export interface ProjectEstimate {
	projectId: string;
	title: string;
	clientName: string;
	estimate: Estimate;
}

/** Files per project, by gallery kind and media type, with how many the client selected. */
async function mediaCounts(photographerId: string, projectIds: string[]) {
	if (projectIds.length === 0)
		return new Map<
			string,
			{ proofs: number; finals: number; selected: number; videos: number }
		>();
	const rows = await db.$queryRaw<MediaRow[]>`
		SELECT g.project_id, g.kind::text AS kind, i.type::text AS type,
			COUNT(*) AS files, COUNT(*) FILTER (WHERE i.selected) AS selected
		FROM gallery_items i JOIN galleries g ON g.id = i.gallery_id
		WHERE g.photographer_id = ${photographerId} AND g.project_id = ANY(${projectIds})
		GROUP BY 1, 2, 3`;
	const map = new Map<
		string,
		{ proofs: number; finals: number; selected: number; videos: number }
	>();
	for (const row of rows) {
		const media = map.get(row.project_id) ?? {
			proofs: 0,
			finals: 0,
			selected: 0,
			videos: 0,
		};
		const files = Number(row.files);
		if (row.type === "VIDEO") media.videos += files;
		else if (row.kind === "PROOFS") {
			media.proofs += files;
			media.selected += Number(row.selected);
		} else media.finals += files;
		map.set(row.project_id, media);
	}
	return map;
}

/** The studio's usual days from shoot to delivery, per service and overall. */
async function turnaround(photographerId: string) {
	const rows = await db.$queryRaw<HistoryRow[]>`
		SELECT service_type::text AS service_type,
			percentile_cont(0.5) WITHIN GROUP (
				ORDER BY (delivered_at::date - event_date::date)
			)::float AS median,
			COUNT(*) AS samples
		FROM projects
		WHERE photographer_id = ${photographerId} AND delivered_at IS NOT NULL
			AND event_date IS NOT NULL AND delivered_at >= event_date
		GROUP BY ROLLUP (service_type)`;
	const all = rows.find((r) => r.service_type === null);
	return (service: string) => {
		const own = rows.find((r) => r.service_type === service);
		const pick = own && Number(own.samples) >= 3 ? own : all;
		return {
			medianDays: pick?.median ?? null,
			samples: pick ? Number(pick.samples) : 0,
		};
	};
}

async function estimateMany(
	photographerId: string,
	projects: {
		id: string;
		title: string;
		stage: Parameters<typeof estimateProject>[0]["stage"];
		serviceType: string;
		mediaType: "PHOTO" | "VIDEO" | "BOTH";
		eventDate: Date | null;
		deliveryDeadline: Date | null;
		client: { name: string } | null;
		contactName: string | null;
	}[],
): Promise<ProjectEstimate[]> {
	const [media, history, workload] = await Promise.all([
		mediaCounts(
			photographerId,
			projects.map((p) => p.id),
		),
		turnaround(photographerId),
		db.project.count({
			where: { photographerId, stage: { in: EDITING_STAGES } },
		}),
	]);
	const today = new Date();
	return projects.map((project) => {
		const editing = EDITING_STAGES.includes(project.stage);
		return {
			projectId: project.id,
			title: project.title,
			clientName: project.client?.name ?? project.contactName ?? "",
			estimate: estimateProject({
				stage: project.stage,
				serviceType: project.serviceType as ServiceType,
				mediaType: project.mediaType,
				eventDate: project.eventDate,
				deliveryDeadline: project.deliveryDeadline,
				media: media.get(project.id) ?? {
					proofs: 0,
					finals: 0,
					selected: 0,
					videos: 0,
				},
				history: history(project.serviceType),
				workload: Math.max(0, workload - (editing ? 1 : 0)),
				today,
			}),
		};
	});
}

/** One project's estimate; null when it isn't the studio's. */
export async function getProjectEstimate(
	photographerId: string,
	projectId: string,
) {
	const project = await db.project.findFirst({
		where: { id: projectId, photographerId },
		select: projectSelect,
	});
	if (!project) return null;
	const [estimate] = await estimateMany(photographerId, [project]);
	return estimate;
}

/** Every project not delivered yet, soonest finish first: the studio's forecast. */
export async function getActiveEstimates(photographerId: string, take = 60) {
	const projects = await db.project.findMany({
		where: { photographerId, stage: { not: "DELIVERY" } },
		orderBy: { updatedAt: "desc" },
		take,
		select: projectSelect,
	});
	const estimates = await estimateMany(photographerId, projects);
	return estimates.sort((a, b) =>
		a.estimate.finishDate.localeCompare(b.estimate.finishDate),
	);
}
