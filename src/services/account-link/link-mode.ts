import { isPhoneEmail } from "@/lib/phone";
import type { LinkMode } from "./schemas";

/**
 * Which other account the signed-in one can link: a phone account links an
 * email account, an email account without a number links a phone account.
 * Null when it already has both.
 */
export function linkModeFor(user: {
	email: string;
	phoneNumber?: string | null;
}): LinkMode | null {
	if (isPhoneEmail(user.email)) return "email";
	return user.phoneNumber ? null : "phone";
}
