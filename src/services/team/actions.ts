"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendTeamInvitationEmail } from "@/lib/mail/send-team-email";
import { searchQuerySchema } from "@/services/clients/schemas";
import type { PickerOption } from "@/services/shared/picker";
import { emptyToNull, idSchema } from "@/services/shared/schemas";
import { assignSchema, memberSchema, unassignSchema } from "./schemas";

const PICKER_LIMIT = 8;

function revalidateTeam() {
	revalidatePath("/dashboard", "layout");
	revalidatePath("/team", "layout");
}

/**
 * Invites a collaborator by email. Inviting the same address again (after a
 * decline, say) refreshes the invitation instead of duplicating it.
 */
export async function inviteTeamMember(
	input: unknown,
): Promise<ActionResult<{ emailed: boolean }>> {
	const { session, photographerId } = await requirePhotographer();
	const parsed = memberSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const email = parsed.data.email.toLowerCase();
	if (email === session.user.email.toLowerCase()) return fail("inviteSelf");

	const existing = await db.teamMember.findUnique({
		where: { photographerId_email: { photographerId, email } },
		select: { status: true },
	});
	if (existing?.status === "ACCEPTED") return fail("alreadyInTeam");

	const data = {
		name: parsed.data.name,
		specialty: emptyToNull(parsed.data.specialty),
		status: "PENDING" as const,
		invitedAt: new Date(),
		respondedAt: null,
	};
	await db.teamMember.upsert({
		where: { photographerId_email: { photographerId, email } },
		create: { photographerId, email, ...data },
		update: data,
	});

	const [account, studio] = await Promise.all([
		db.user.findUnique({ where: { email }, select: { locale: true } }),
		db.studio.findUnique({ where: { photographerId }, select: { name: true } }),
	]);
	const emailed = await sendTeamInvitationEmail({
		to: email,
		locale: resolveMailLocale(account?.locale, session.user.locale),
		studio: studio?.name ?? session.user.name,
		name: parsed.data.name,
		hasAccount: account !== null,
	})
		.then(() => true)
		.catch((error) => {
			console.error("Failed to send the team invitation:", error);
			return false;
		});

	revalidateTeam();
	return ok({ emailed });
}

/** Removes someone from the team, and so from every project they were on. */
export async function removeTeamMember(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = idSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.teamMember.deleteMany({
		where: { id: parsed.data, photographerId },
	});
	if (count === 0) return fail("notFound");

	revalidateTeam();
	return ok();
}

/** Puts a team member on a project, with their job on it. */
export async function assignTeamMember(input: unknown): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = assignSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { projectId, memberId, role } = parsed.data;
	const [project, member] = await Promise.all([
		db.project.count({ where: { id: projectId, photographerId } }),
		db.teamMember.count({
			where: { id: memberId, photographerId, status: { not: "DECLINED" } },
		}),
	]);
	if (!project || !member) return fail("notFound");

	await db.projectAssignment.upsert({
		where: { projectId_memberId: { projectId, memberId } },
		create: { projectId, memberId, role: emptyToNull(role) },
		update: { role: emptyToNull(role) },
	});

	revalidateTeam();
	return ok();
}

export async function unassignTeamMember(
	input: unknown,
): Promise<ActionResult> {
	const { photographerId } = await requirePhotographer();
	const parsed = unassignSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const { count } = await db.projectAssignment.deleteMany({
		where: {
			id: parsed.data.assignmentId,
			projectId: parsed.data.projectId,
			project: { photographerId },
		},
	});
	if (count === 0) return fail("notFound");

	revalidateTeam();
	return ok();
}

/** Team members who haven't declined, matching `q`, for the assignment picker. */
export async function findMyTeamMembers(
	input: unknown,
): Promise<ActionResult<PickerOption[]>> {
	const { photographerId } = await requirePhotographer();
	const parsed = searchQuerySchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);

	const q = parsed.data;
	const rows = await db.teamMember.findMany({
		where: {
			photographerId,
			status: { not: "DECLINED" },
			...(q && {
				OR: [
					{ name: { contains: q, mode: "insensitive" } },
					{ specialty: { contains: q, mode: "insensitive" } },
				],
			}),
		},
		select: { id: true, name: true, specialty: true },
		orderBy: [{ name: "asc" }, { id: "asc" }],
		take: PICKER_LIMIT,
	});
	return ok(
		rows.map((row) => ({
			id: row.id,
			label: row.name,
			detail: row.specialty ?? "",
		})),
	);
}
