"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { toE164 } from "@/lib/phone";
import {
	confirmAccountLink,
	requestAccountLink,
} from "@/services/account-link/actions";
import type { LinkMode } from "@/services/account-link/schemas";
import { ContactChange } from "./contact-change";

const parseEmail = (raw: string) =>
	z.email().safeParse(raw.trim()).success ? raw.trim().toLowerCase() : null;

/** Our action results, shaped like Better Auth's for the shared form. */
const asAuthResult = (result: ActionResult) => ({
	error: result.ok ? null : { code: result.error },
});

/**
 * Brings a client's other account into this one: a phone account links the
 * account of its email, an email account the one it opened by phone. A code
 * sent there proves it's theirs; projects and messages then live here.
 */
export function LinkAccount({ mode }: { mode: LinkMode }) {
	const t = useTranslations("Portal.account.link");

	return (
		<section id="link-account" className="scroll-mt-20">
			<ContactChange
				title={t("title")}
				current={null}
				verified={false}
				summary={
					<p className="text-sm text-muted-foreground">{t(`hint.${mode}`)}</p>
				}
				actionLabel={t("action")}
				successMessage={t("done")}
				parse={mode === "email" ? parseEmail : toE164}
				invalidKey={mode === "email" ? "invalidEmail" : "invalidPhone"}
				inputType={mode === "email" ? "email" : "tel"}
				placeholder={mode === "email" ? "client@example.com" : "20 123 456"}
				request={async (contact) =>
					asAuthResult(await requestAccountLink({ contact }))
				}
				confirm={async (contact, code) =>
					asAuthResult(await confirmAccountLink({ contact, code }))
				}
			/>
		</section>
	);
}
