"use server";

import { headers } from "next/headers";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/require-user";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { getRequestLocale } from "@/lib/mail/request-locale";
import { sendEmailVerificationOtp } from "@/lib/mail/send-email-verification-otp";
import { maskEmail, maskPhone } from "@/lib/mask";
import { realEmail } from "@/lib/phone";
import { sendOtpSms } from "@/lib/sms/send-client-sms";
import {
	checkIdentityCode,
	grantEmailChangeProof,
	IDENTITY_CODE_MINUTES,
	issueIdentityCode,
} from "./identity";
import { identityConfirmSchema } from "./schemas";

export interface IdentityCheck {
	needsPassword: boolean;
	/** Where the code went, with most of it hidden. */
	hint: string;
}

/**
 * Where to prove it's really the owner: the verified phone first (it does not
 * depend on the mailbox), else the current real email.
 */
async function codeChannel(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			email: true,
			phoneNumber: true,
			phoneNumberVerified: true,
			accounts: { select: { providerId: true } },
		},
	});
	if (!user) return null;
	const email = realEmail(user.email);
	const hasPassword = user.accounts.some((a) => a.providerId === "credential");
	if (user.phoneNumber && user.phoneNumberVerified)
		return {
			kind: "phone" as const,
			to: user.phoneNumber,
			hint: maskPhone(user.phoneNumber),
			hasPassword,
		};
	if (email)
		return {
			kind: "email" as const,
			to: email,
			hint: maskEmail(email),
			hasPassword,
		};
	return null;
}

/** Sends the code that starts an email change, to the phone or current email. */
export async function startIdentityCheck(): Promise<
	ActionResult<IdentityCheck>
> {
	const { user } = await requireUser();
	const channel = await codeChannel(user.id);
	if (!channel) return fail("generic");

	const code = await issueIdentityCode(user.id);
	if (!code) return fail("LINK_TOO_SOON");

	const locale = resolveMailLocale(await getRequestLocale(), user.locale);
	// Not awaited: texts can take a few seconds to be queued.
	const sending =
		channel.kind === "phone"
			? sendOtpSms({
					to: channel.to,
					locale,
					code,
					expiresInMinutes: IDENTITY_CODE_MINUTES,
				})
			: sendEmailVerificationOtp({
					to: channel.to,
					otp: code,
					expiresInMinutes: IDENTITY_CODE_MINUTES,
				});
	sending.catch((error) =>
		console.error("Failed to send an identity code:", error),
	);
	return ok({ needsPassword: channel.hasPassword, hint: channel.hint });
}

/** Checks the password (if the account has one) and the code, then unlocks the change. */
export async function confirmIdentityCheck(
	input: unknown,
): Promise<ActionResult> {
	const { user } = await requireUser();
	const parsed = identityConfirmSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	const { password, code } = parsed.data;

	const channel = await codeChannel(user.id);
	if (!channel) return fail("generic");
	if (channel.hasPassword) {
		const valid =
			password !== undefined &&
			(await auth.api
				.verifyPassword({ headers: await headers(), body: { password } })
				.then(() => true)
				.catch(() => false));
		if (!valid) {
			// A wrong password costs one of the code's three tries, so it can't be guessed freely.
			await checkIdentityCode(user.id, "");
			return fail("INVALID_PASSWORD");
		}
	}

	const error = await checkIdentityCode(user.id, code);
	if (error) return fail(error);
	await grantEmailChangeProof(user.id, user.email);
	return ok();
}
