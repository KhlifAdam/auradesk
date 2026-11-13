"use server";

import { isAPIError } from "better-auth/api";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type ActionResult, fail, failFromZod, ok } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/require-user";
import { auth } from "@/lib/auth/server";
import { realEmail } from "@/lib/phone";
import { setPasswordSchema } from "./schemas";

/** Better Auth error codes this action turns into `Errors` keys. */
const AUTH_ERRORS: Record<string, string> = {
	SESSION_NOT_FRESH: "sessionNotFresh",
	PASSWORD_ALREADY_SET: "passwordAlreadySet",
	PASSWORD_TOO_SHORT: "passwordTooShort",
};

/**
 * Adds a password to an account that has none (signed up with a phone or
 * Google). Password sign-in uses the email, so the account must have a real,
 * verified address first. Better Auth refuses if a password already exists
 * and asks for a recent sign-in.
 */
export async function setInitialPassword(
	input: unknown,
): Promise<ActionResult> {
	const { user } = await requireUser();
	const parsed = setPasswordSchema.safeParse(input);
	if (!parsed.success) return failFromZod(parsed.error);
	if (!realEmail(user.email) || !user.emailVerified)
		return fail("emailNotVerified");

	try {
		await auth.api.setPassword({
			headers: await headers(),
			body: { newPassword: parsed.data.newPassword },
		});
	} catch (error) {
		const code = isAPIError(error) ? String(error.body?.code ?? "") : "";
		return fail(AUTH_ERRORS[code] ?? "generic");
	}
	revalidatePath("/portal/settings");
	revalidatePath("/portal/account");
	return ok();
}
