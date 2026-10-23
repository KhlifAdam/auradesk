import "server-only";

import { db } from "@/lib/db";
import { notifyStageChange } from "./stage-notices";
import { PROJECT_STAGES, type ProjectStage, stageIndex } from "./stages";
import { CLIENT_PROOFING_STAGE } from "./visibility";

// The workflow follows the work: each event below moves a project forward to
// its step, never back, and only for studios that keep it on (the default).
// Delivery is never automatic: it opens the originals and needs payment.

/** What happened to a gallery, from the photographer's side. */
export type GalleryEvent = "uploaded" | "organized" | "shared";

type GalleryKind = "PROOFS" | "FINAL";

/** The step a gallery event leads to, given where the project is. */
export function stageForGalleryEvent(
	event: GalleryEvent,
	kind: GalleryKind,
	current: ProjectStage,
): ProjectStage {
	switch (event) {
		case "uploaded":
			// Edited photos arriving after the client chose are the export.
			return kind === "FINAL" &&
				stageIndex(current) >= stageIndex(CLIENT_PROOFING_STAGE)
				? "EXPORT"
				: "IMPORT";
		case "organized":
			return "ORGANIZATION";
		case "shared":
			// Proofs go out to choose from; finals go out to approve.
			return kind === "PROOFS" ? CLIENT_PROOFING_STAGE : "VALIDATION";
	}
}

const stagesBefore = (stage: ProjectStage) =>
	PROJECT_STAGES.slice(0, stageIndex(stage));

/** Only projects of studios with the automatic workflow switched on. */
const AUTO_ENABLED = {
	photographer: { studio: { is: { autoAdvanceStages: true } } },
};

/**
 * Moves the project forward to `to` when it is behind it, and tells the
 * client when that opens their galleries. Returns the new stage, or null
 * when nothing changed. Never throws: the work that triggered it stands.
 */
export async function advanceProjectStage(
	projectId: string,
	to: ProjectStage,
	options: { notify?: boolean } = {},
): Promise<ProjectStage | null> {
	try {
		const behind = { id: projectId, stage: { in: stagesBefore(to) } };
		const project = await db.project.findFirst({
			where: { ...behind, ...AUTO_ENABLED },
			select: { stage: true },
		});
		if (!project) return null;
		// Conditional write: a manual move in between wins.
		const { count } = await db.project.updateMany({
			where: { ...behind, stage: project.stage },
			data: { stage: to },
		});
		if (count === 0) return null;
		if (options.notify !== false)
			await notifyStageChange(projectId, project.stage, to);
		return to;
	} catch (error) {
		console.error(`Failed to move project ${projectId} to ${to}:`, error);
		return null;
	}
}

/** Moves a gallery's project to the step the event leads to. */
export async function advanceForGallery(
	galleryId: string,
	event: GalleryEvent,
	options?: { notify?: boolean },
): Promise<ProjectStage | null> {
	const gallery = await db.gallery.findUnique({
		where: { id: galleryId },
		select: {
			kind: true,
			projectId: true,
			project: { select: { stage: true } },
		},
	});
	if (!gallery) return null;
	const to = stageForGalleryEvent(event, gallery.kind, gallery.project.stage);
	return advanceProjectStage(gallery.projectId, to, options);
}

/**
 * Projects whose shoot day has come move to Shooting. Run daily by the
 * scheduler and when a photographer opens their projects, for all studios or
 * one.
 */
export async function advanceShootDays(photographerId?: string) {
	const { count } = await db.project.updateMany({
		where: {
			...(photographerId && { photographerId }),
			...AUTO_ENABLED,
			stage: { in: stagesBefore("SHOOTING") },
			eventDate: { lte: new Date() },
		},
		data: { stage: "SHOOTING" },
	});
	return count;
}

/** Whether the studio's projects move forward on their own. */
export async function isAutoAdvanceOn(photographerId: string) {
	const studio = await db.studio.findUnique({
		where: { photographerId },
		select: { autoAdvanceStages: true },
	});
	return studio?.autoAdvanceStages ?? false;
}
