import "server-only";

import {
	APIError,
	createAuthMiddleware,
	getSessionFromCtx,
	isAPIError,
} from "better-auth/api";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { getRequestLocale } from "@/lib/mail/request-locale";
import { sendEmailChangedNotice } from "@/lib/mail/send-email-changed-notice";
import { realEmail } from "@/lib/phone";
import {
	clearEmailChangeProof,
	findEmailChangeProof,
} from "@/services/account/identity";

const REQUEST_PATH = "/email-otp/request-email-change";
const CHANGE_PATH = "/email-otp/change-email";

/**
 * An email can only change after the account proved who it is (password and
 * a code sent to its phone or current email, see `identity-actions`). Checked
 * here, on the server, so calling the endpoints directly doesn't skip it.
 */
export const emailChangeHooks = {
	before: createAuthMiddleware(async (ctx) => {
		if (ctx.path !== REQUEST_PATH && ctx.path !== CHANGE_PATH) return;
		const session = await getSessionFromCtx(ctx);
		if (!session || !(await findEmailChangeProof(session.user.id)))
			throw new APIError("FORBIDDEN", {
				code: "IDENTITY_CHECK_REQUIRED",
				message: "Confirm your identity first",
			});
	}),
	after: createAuthMiddleware(async (ctx) => {
		if (ctx.path !== CHANGE_PATH || isAPIError(ctx.context.returned)) return;
		const session = await getSessionFromCtx(ctx);
		if (!session) return;
		const proof = await findEmailChangeProof(session.user.id);
		await clearEmailChangeProof(session.user.id);
		const oldEmail = proof ? realEmail(proof.email) : null;
		if (!oldEmail) return;
		sendEmailChangedNotice({
			to: oldEmail,
			locale: resolveMailLocale(session.user.locale, await getRequestLocale()),
			newEmail: String(ctx.body?.newEmail ?? "").toLowerCase(),
		}).catch((error) =>
			console.error("Failed to send the email-changed notice:", error),
		);
	}),
};
