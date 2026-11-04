import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";

export const IDENTITY_CODE_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const RESEND_GAP_MS = 60_000;
const PROOF_MINUTES = 10;

/** What a pending code is for; stored as JSON in `verifications.value`. */
const pendingSchema = z.object({
	hash: z.string(),
	attempts: z.number().int(),
});

const codeId = (userId: string) => `identity-code:${userId}`;
const proofId = (userId: string) => `email-change-proof:${userId}`;
const hashCode = (userId: string, code: string) =>
	createHash("sha256").update(`${userId}:${code}`).digest("hex");

/** A fresh 6-digit code, replacing any earlier one; null if asked within a minute. */
export async function issueIdentityCode(userId: string) {
	const previous = await db.verification.findFirst({
		where: { identifier: codeId(userId) },
		orderBy: { createdAt: "desc" },
	});
	if (previous && Date.now() - previous.createdAt.getTime() < RESEND_GAP_MS)
		return null;

	const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
	await db.verification.deleteMany({ where: { identifier: codeId(userId) } });
	await db.verification.create({
		data: {
			identifier: codeId(userId),
			value: JSON.stringify({ hash: hashCode(userId, code), attempts: 0 }),
			expiresAt: new Date(Date.now() + IDENTITY_CODE_MINUTES * 60_000),
		},
	});
	return code;
}

export type IdentityCodeError =
	| "OTP_NOT_FOUND"
	| "OTP_EXPIRED"
	| "INVALID_OTP"
	| "TOO_MANY_ATTEMPTS";

/** Checks the code; it can be used once, and tried three times. */
export async function checkIdentityCode(
	userId: string,
	code: string,
): Promise<IdentityCodeError | null> {
	const row = await db.verification.findFirst({
		where: { identifier: codeId(userId) },
		orderBy: { createdAt: "desc" },
	});
	const pending = row && pendingSchema.safeParse(JSON.parse(row.value));
	if (!row || !pending?.success) return "OTP_NOT_FOUND";
	if (row.expiresAt.getTime() < Date.now()) {
		await db.verification.delete({ where: { id: row.id } });
		return "OTP_EXPIRED";
	}
	if (pending.data.attempts >= MAX_ATTEMPTS) return "TOO_MANY_ATTEMPTS";

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
		return "INVALID_OTP";
	}
	await db.verification.delete({ where: { id: row.id } });
	return null;
}

/**
 * Remembers that this account just proved who it is, for a few minutes. It
 * keeps the email at that moment, to warn that address once the email changes.
 */
export async function grantEmailChangeProof(userId: string, email: string) {
	await db.verification.deleteMany({ where: { identifier: proofId(userId) } });
	await db.verification.create({
		data: {
			identifier: proofId(userId),
			value: email,
			expiresAt: new Date(Date.now() + PROOF_MINUTES * 60_000),
		},
	});
}

/** The proof still in force, with the email the account had; null without one. */
export async function findEmailChangeProof(userId: string) {
	const proof = await db.verification.findFirst({
		where: { identifier: proofId(userId), expiresAt: { gt: new Date() } },
		select: { value: true },
	});
	return proof ? { email: proof.value } : null;
}

export async function clearEmailChangeProof(userId: string) {
	await db.verification.deleteMany({ where: { identifier: proofId(userId) } });
}
