import type { PaymentStatus } from "./options";
import {
	DELIVERED_STAGES,
	isDeliveredStage,
	PROJECT_STAGES,
	type ProjectStage,
	stageIndex,
} from "./stages";

// What the project's client may see, in two levels:
// - from the Selection step, the shared galleries as PREVIEWS, to choose and
//   comment (proofing). The originals stay out of reach;
// - once the project is delivered AND paid, the ORIGINALS: full quality,
//   video playback and downloads. They stay open when it is then completed.

/** The step from which shared galleries open to the client for choosing. */
export const CLIENT_PROOFING_STAGE: ProjectStage = "SELECTION";

const VIEWABLE_STAGES = PROJECT_STAGES.slice(stageIndex(CLIENT_PROOFING_STAGE));

/** Prisma filter: projects whose shared galleries the client may browse. */
export const CLIENT_VIEWABLE_PROJECT = {
	stage: { in: [...VIEWABLE_STAGES] },
};

export const canClientView = (project: { stage: ProjectStage }) =>
	stageIndex(project.stage) >= stageIndex(CLIENT_PROOFING_STAGE);

/** Prisma filter: projects whose originals the client may open and download. */
export const CLIENT_DELIVERED_PROJECT = {
	stage: { in: [...DELIVERED_STAGES] },
	paymentStatus: "PAID",
} as const satisfies {
	stage: { in: ProjectStage[] };
	paymentStatus: PaymentStatus;
};

export const isDeliveredToClient = (project: {
	stage: ProjectStage;
	paymentStatus: PaymentStatus;
}) =>
	isDeliveredStage(project.stage) &&
	project.paymentStatus === CLIENT_DELIVERED_PROJECT.paymentStatus;

/** The step a project can't reach until it is paid. */
export const PAYMENT_GATED_STAGE: ProjectStage = "DELIVERY";
