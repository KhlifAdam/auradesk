"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { requireClient } from "@/lib/auth/require-client";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { getRequestLocale } from "@/lib/mail/request-locale";
import { sendEmailVerificationOtp } from "@/lib/mail/send-email-verification-otp";
import { toE164 } from "@/lib/phone";
import { sendOtpSms } from "@/lib/sms/send-client-sms";
import { checkLinkCode, issueLinkCode, LINK_CODE_MINUTES } from "./codes";
import { linkModeFor } from "./link-mode";
import { mergeAccounts } from "./merge";
import { type LinkMode, linkConfirmSchema, linkRequestSchema } from "./schemas";

function parseContact(mode: LinkMode, raw: string) {
	if (mode === "phone") return toE164(raw);
	const email = raw.trim().toLowerCase();
	return z.email().safeParse(email).success ? email : null;
}

/**
 * The account behind `contact` that may be folded into the signed-in one:
 * another client account, and no contact of the same kind on both sides.
 */
type Linkable =
	| { other: { id: string }; error?: never }
	| { other?: never; error: string };

async function findLinkable(
	userId: string,
	mode: LinkMode,
	contact: string,
): Promise<Linkable> {
	const other = await db.user.findFirst({
		where: mode === "email" ? { email: contact } : { phoneNumber: contact },
		select: { id: true, role: true, banned: true, phoneNumber: true },
	});
	if (!other || other.id === userId) return { error: "NO_ACCOUNT_TO_LINK" };
	// Studios, collaborators and admins keep their own account.
	if (other.role !== ROLES.client || other.banned)
		return { error: "ACCOUNT_NOT_LINKABLE" };
	// A phone account can't absorb an email account that has another number.
	if (mode === "email" && other.phoneNumber) return { error: "LINK_CONFLICT" };
	return { other: { id: other.id } };
}

/** Sends a code to the other account's email or number, to prove it's theirs. */
export async function requestAccountLink(
	input: unknown,
): Promise<ActionResult> {
	const { session } = await requireClient();
	const parsed = linkRequestSchema.safeParse(input);
	const mode = linkModeFor(session.user);
	if (!parsed.success || !mode) return fail("generic");
	const contact = parseContact(mode, parsed.data.contact);
	if (!contact)
		return fail(mode === "email" ? "INVALID_EMAIL" : "INVALID_PHONE_NUMBER");

	const found = await findLinkable(session.user.id, mode, contact);
	if (found.error !== undefined) return fail(found.error);
	const code = await issueLinkCode(session.user.id, contact, found.other.id);
	if (!code) return fail("LINK_TOO_SOON");

	// Not awaited: WhatsApp messages are queued and can take a few seconds.
	const sending =
		mode === "email"
			? sendEmailVerificationOtp({
					to: contact,
					otp: code,
					expiresInMinutes: LINK_CODE_MINUTES,
				})
			: sendOtpSms({
					to: contact,
					locale: resolveMailLocale(
						await getRequestLocale(),
						session.user.locale,
					),
					code,
					expiresInMinutes: LINK_CODE_MINUTES,
				});
	sending.catch((error) => console.error("Failed to send a link code:", error));
	return ok();
}

/** Checks the code, then folds the other account into the signed-in one. */
export async function confirmAccountLink(
	input: unknown,
): Promise<ActionResult> {
	const { session } = await requireClient();
	const parsed = linkConfirmSchema.safeParse(input);
	const mode = linkModeFor(session.user);
	if (!parsed.success || !mode) return fail("INVALID_OTP");
	const contact = parseContact(mode, parsed.data.contact);
	if (!contact) return fail("INVALID_OTP");

	const check = await checkLinkCode(session.user.id, contact, parsed.data.code);
	if (!check.ok) return fail(check.error);
	// Checked again: the other account may have changed since the code was sent.
	const found = await findLinkable(session.user.id, mode, contact);
	if (found.error !== undefined) return fail(found.error);
	if (found.other.id !== check.otherId) return fail("NO_ACCOUNT_TO_LINK");

	await mergeAccounts(session.user.id, found.other.id);
	// Studios see the client's projects and messages under one account.
	revalidatePath("/portal", "layout");
	revalidatePath("/dashboard", "layout");
	return ok();
}
