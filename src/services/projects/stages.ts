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
	"VALIDATION",
	"DELIVERY",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const stageIndex = (stage: ProjectStage) =>
	PROJECT_STAGES.indexOf(stage);
