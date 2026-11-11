import "server-only";

import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import {
	type ProjectStageNotice,
	sendProjectStageEmail,
} from "@/lib/mail/send-client-notices";
import { realEmail } from "@/lib/phone";
import { sendProjectStageSms } from "@/lib/sms/send-client-sms";
import { flagProjectForClient } from "@/services/changes/flag";
import { type ProjectStage, stageIndex } from "./stages";
import { CLIENT_PROOFING_STAGE, PAYMENT_GATED_STAGE } from "./visibility";

/** What a move from one step to another tells the client, if anything. */
function noticeFor(
	from: ProjectStage,
	to: ProjectStage,
): ProjectStageNotice | null {
	if (stageIndex(to) <= stageIndex(from)) return null;
	// The update only reaches Delivery (or Completed) once paid: the originals
	// are now open. Completing an already delivered project says nothing new.
	const gate = stageIndex(PAYMENT_GATED_STAGE);
	if (stageIndex(from) < gate && stageIndex(to) >= gate)
		return "projectDelivered";
	const proofing = stageIndex(CLIENT_PROOFING_STAGE);
	if (stageIndex(from) < proofing && stageIndex(to) >= proofing)
		return "galleriesReady";
	return null;
}

/**
 * Tells the client by email (or SMS for a phone-only client) when a forward
 * move opens their shared galleries or delivers the project. Never throws.
 */
export async function notifyStageChange(
	projectId: string,
	from: ProjectStage,
	to: ProjectStage,
) {
	const kind = noticeFor(from, to);
	// Any move lights the project up for the client; the special notices below
	// replace the generic one.
	await flagProjectForClient(
		projectId,
		kind ? {} : undefined,
		kind === "projectDelivered"
			? "delivered"
			: kind === "galleriesReady"
				? "proofs"
				: "stage",
	);
	if (!kind) return;
	const project = await db.project.findUnique({
		where: { id: projectId },
		select: {
			title: true,
			client: { select: { email: true, phoneNumber: true, locale: true } },
			photographer: {
				select: { name: true, studio: { select: { name: true } } },
			},
			_count: { select: { galleries: { where: { sharedAt: { not: null } } } } },
		},
	});
	// Nothing to choose from or download without a shared gallery.
	if (!project?.client || project._count.galleries === 0) return;

	const { client, photographer } = project;
	const notice = {
		locale: resolveMailLocale(client.locale),
		kind,
		studio: photographer.studio?.name ?? photographer.name,
		project: project.title,
		projectId,
	};
	const send = realEmail(client.email)
		? sendProjectStageEmail({ to: client.email, ...notice })
		: client.phoneNumber
			? sendProjectStageSms({ to: client.phoneNumber, ...notice })
			: Promise.resolve();
	await send.catch((error) =>
		console.error(`Failed to send the ${kind} notice:`, error),
	);
}
