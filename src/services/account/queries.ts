import "server-only";

import { db } from "@/lib/db";
import { describeDevice } from "@/lib/user-agent";
import type { SecurityOverview } from "./types";

/**
 * What the Settings page shows about signing in: whether the account has a
 * password, which providers are linked, and where it is signed in. Never the
 * session tokens themselves.
 */
export async function getSecurityOverview(
	userId: string,
	currentSessionId: string,
): Promise<SecurityOverview> {
	const [accounts, sessions] = await Promise.all([
		db.account.findMany({
			where: { userId },
			select: { id: true, providerId: true },
		}),
		db.session.findMany({
			where: { userId, expiresAt: { gt: new Date() } },
			orderBy: { updatedAt: "desc" },
			select: { id: true, userAgent: true, updatedAt: true },
		}),
	]);
	return {
		hasPassword: accounts.some((a) => a.providerId === "credential"),
		linked: accounts
			.filter((a) => a.providerId !== "credential")
			.map((a) => ({ provider: a.providerId, accountId: a.id })),
		sessions: sessions.map((session) => ({
			id: session.id,
			...describeDevice(session.userAgent),
			lastActiveAt: session.updatedAt.toISOString(),
			current: session.id === currentSessionId,
		})),
	};
}
