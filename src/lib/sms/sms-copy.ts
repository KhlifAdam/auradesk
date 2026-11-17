import { type Locale, toLocale } from "@/i18n/config";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import type { SmsKey } from "./sms-kinds";

export { SMS_KINDS, type SmsKey } from "./sms-kinds";

/** Every kind has a text, and every text a kind: the compiler checks both. */
const SMS_MESSAGES: Record<"en" | "fr", Record<SmsKey, string>> = {
	en: en.Sms,
	fr: fr.Sms,
};
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const sameKeys: Exact<keyof typeof en.Sms, SmsKey> = true;
void sameKeys;

/** A text message in the recipient's language, with `{name}` placeholders filled. */
export function smsText(
	locale: Locale | string | null | undefined,
	key: SmsKey,
	vars: Record<string, string> = {},
) {
	const template = SMS_MESSAGES[toLocale(locale ?? undefined)][key];
	return template.replace(
		/\{(\w+)\}/g,
		(match, name: string) => vars[name] ?? match,
	);
}
