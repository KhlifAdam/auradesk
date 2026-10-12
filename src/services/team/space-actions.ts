"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import { idSchema } from "@/services/shared/schemas";

/**
 * Answers a team invitation sent to the user's address. The address must be
 * verified, so nobody can join a team by registering someone else's email.
 */
async function answer(input: unknown, accept: boolean): Promise<ActionResult> {
	const session = await requireUser();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const email = realEmail(session.user.email);
	if (!email || !session.user.emailVerified) return fail("emailNotVerified");

	const { count } = await db.teamMember.updateMany({
		where: { id: parsed.data, email: email.toLowerCase(), status: "PENDING" },
		data: accept
			? { status: "ACCEPTED", userId: session.user.id, respondedAt: new Date() }
			: { status: "DECLINED", respondedAt: new Date() },
	});
	if (count === 0) return fail("invitationNotFound");

	revalidatePath("/team", "layout");
	revalidatePath("/dashboard", "layout");
	return ok();
}

export async function acceptTeamInvitation(input: unknown) {
	return answer(input, true);
}

export async function declineTeamInvitation(input: unknown) {
	return answer(input, false);
}
