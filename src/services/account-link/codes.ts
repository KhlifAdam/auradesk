import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";

export const LINK_CODE_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const RESEND_GAP_MS = 60_000;

/** What a pending link code is for; stored as JSON in `verifications.value`. */
const pendingSchema = z.object({
	hash: z.string(),
	contact: z.string(),
	otherId: z.string(),
	attempts: z.number().int(),
});

const identifier = (userId: string) => `account-link:${userId}`;
const hashCode = (userId: string, code: string) =>
	createHash("sha256").update(`${userId}:${code}`).digest("hex");

/**
 * A fresh 6-digit code proving `contact` (the other account's email or
 * number), replacing any earlier one. Null when asked again within a minute.
 */
export async function issueLinkCode(
	userId: string,
	contact: string,
	otherId: string,
) {
	const previous = await db.verification.findFirst({
		where: { identifier: identifier(userId) },
		orderBy: { createdAt: "desc" },
	});
	if (previous && Date.now() - previous.createdAt.getTime() < RESEND_GAP_MS)
		return null;

	const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
	await db.verification.deleteMany({
		where: { identifier: identifier(userId) },
	});
	await db.verification.create({
		data: {
			identifier: identifier(userId),
			value: JSON.stringify({
				hash: hashCode(userId, code),
				contact,
				otherId,
				attempts: 0,
			}),
			expiresAt: new Date(Date.now() + LINK_CODE_MINUTES * 60_000),
		},
	});
	return code;
}

export type LinkCodeCheck =
	| { ok: true; otherId: string }
	| {
			ok: false;
			error:
				| "OTP_NOT_FOUND"
				| "OTP_EXPIRED"
				| "INVALID_OTP"
				| "TOO_MANY_ATTEMPTS";
	  };

/** Checks a code for `contact`; it can be used once, and tried three times. */
export async function checkLinkCode(
	userId: string,
	contact: string,
	code: string,
): Promise<LinkCodeCheck> {
	const row = await db.verification.findFirst({
		where: { identifier: identifier(userId) },
		orderBy: { createdAt: "desc" },
	});
	const pending = row && pendingSchema.safeParse(JSON.parse(row.value));
	if (!row || !pending?.success || pending.data.contact !== contact)
		return { ok: false, error: "OTP_NOT_FOUND" };
	if (row.expiresAt.getTime() < Date.now()) {
		await db.verification.delete({ where: { id: row.id } });
		return { ok: false, error: "OTP_EXPIRED" };
	}
	if (pending.data.attempts >= MAX_ATTEMPTS)
		return { ok: false, error: "TOO_MANY_ATTEMPTS" };

	const given = Buffer.from(hashCode(userId, code));
	const expected = Buffer.from(pending.data.hash);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
		await db.verification.update({
			where: { id: row.id },
			data: {
				value: JSON.stringify({
					...pending.data,
					attempts: pending.data.attempts + 1,
				}),
			},
		});
		return { ok: false, error: "INVALID_OTP" };
	}
	await db.verification.delete({ where: { id: row.id } });
	return { ok: true, otherId: pending.data.otherId };
}
