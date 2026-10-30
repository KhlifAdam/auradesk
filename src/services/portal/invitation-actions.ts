"use server";

import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { db } from "@/lib/db";
import { settleClientRole } from "@/services/auth/settle-client-role";
import { pendingFor, verifiedContact } from "@/services/portal/contacts";
import { revalidateClientWork } from "@/services/projects/revalidate";
import { idSchema } from "@/services/shared/schemas";

/**
 * Answers an invitation sent to a contact the signed-in client has verified:
 * a verified email or a verified phone number. Verification is required, so
 * nobody can claim invitations by registering someone else's address.
 */
async function answerInvitation(
	input: unknown,
	accept: boolean,
): Promise<ActionResult> {
	const { session, clientId } = await requireClient();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { user } = session;
	const contact = verifiedContact(user);
	if (!contact.email && !contact.phone) return fail("emailNotVerified");

	const { count } = await db.project.updateMany({
		where: { id: parsed.data, ...pendingFor(contact) },
		data: accept
			? { clientId, inviteStatus: "ACCEPTED" }
			: { inviteStatus: "DECLINED" },
	});
	if (count === 0) return fail("invitationNotFound");
	if (accept) await settleClientRole(clientId);

	revalidateClientWork();
	return ok();
}

export async function acceptInvitation(input: unknown) {
	return answerInvitation(input, true);
}

export async function declineInvitation(input: unknown) {
	return answerInvitation(input, false);
}
