import "server-only";

import type { AdminAction } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { realEmail } from "@/lib/phone";
import { pageMeta, pageSkip } from "@/services/shared/pagination";

/** Records an admin's action on an account, with names copied in. */
export async function logAdminAction(
	actor: { id: string; name: string },
	action: AdminAction,
	targetId: string,
	reason?: string | null,
) {
	const target = await db.user.findUnique({
		where: { id: targetId },
		select: { name: true, email: true },
	});
	await db.adminAuditLog.create({
		data: {
			actorId: actor.id,
			actorName: actor.name,
			action,
			targetId,
			targetName: target?.name ?? "?",
			targetEmail: target ? realEmail(target.email) : null,
			reason: reason || null,
		},
	});
}

export const AUDIT_PAGE_SIZE = 30;

/** The activity log, newest first; optionally about one account only. */
export async function listAdminActions(page: number, targetId?: string) {
	const where = targetId ? { targetId } : {};
	const meta = pageMeta(
		page,
		await db.adminAuditLog.count({ where }),
		AUDIT_PAGE_SIZE,
	);
	const rows = await db.adminAuditLog.findMany({
		where,
		orderBy: [{ createdAt: "desc" }, { id: "asc" }],
		skip: pageSkip(meta.page, AUDIT_PAGE_SIZE),
		take: AUDIT_PAGE_SIZE,
	});
	return {
		...meta,
		items: rows.map((row) => ({
			id: row.id,
			actorName: row.actorName,
			action: row.action,
			targetId: row.targetId,
			targetName: row.targetName,
			targetEmail: row.targetEmail,
			reason: row.reason,
			createdAt: row.createdAt.toISOString(),
		})),
	};
}
