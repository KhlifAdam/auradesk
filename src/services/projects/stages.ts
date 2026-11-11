/** Workflow from the PRD, in order. Mirrors the `project_stage` enum. */
export const PROJECT_STAGES = [
	"BOOKING",
	"PREP",
	"SHOOTING",
	"IMPORT",
	"SELECTION",
	"ORGANIZATION",
	"POST_PRODUCTION",
	"EXPORT",
	"DELIVERY",
	"COMPLETED",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const stageIndex = (stage: ProjectStage) =>
	PROJECT_STAGES.indexOf(stage);

/**
 * Delivery and beyond: the client has their files. Completed closes the
 * project once they are happy with them.
 */
export const DELIVERED_STAGES = PROJECT_STAGES.slice(stageIndex("DELIVERY"));

export const isDeliveredStage = (stage: ProjectStage) =>
	stageIndex(stage) >= stageIndex("DELIVERY");
