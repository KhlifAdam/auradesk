"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { formatPhone, toE164 } from "@/lib/phone";
import { ContactChange } from "./contact-change";

const parseEmail = (raw: string) =>
	z.email().safeParse(raw.trim()).success ? raw.trim().toLowerCase() : null;

/** The account's email: add one to a phone account, or change it. */
export function EmailContact({
	email,
	verified,
	hasPassword,
}: {
	/** Null for a phone-only account. */
	email: string | null;
	verified: boolean;
	hasPassword: boolean;
}) {
	const t = useTranslations("Portal.account");

	return (
		<ContactChange
			title={t("email")}
			current={email}
			verified={verified}
			parse={parseEmail}
			invalidKey="invalidEmail"
			inputType="email"
			identity={{ hasPassword }}
			placeholder="client@example.com"
			request={(newEmail) =>
				authClient.emailOtp.requestEmailChange({ newEmail })
			}
			confirm={(newEmail, otp) =>
				authClient.emailOtp.changeEmail({ newEmail, otp })
			}
		/>
	);
}

/** The account's phone number: add one to an email account, or change it. */
export function PhoneContact({
	phone,
	verified,
}: {
	phone: string | null;
	verified: boolean;
}) {
	const t = useTranslations("Portal.account");

	return (
		<ContactChange
			title={t("phone")}
			current={phone ? formatPhone(phone) : null}
			verified={verified}
			parse={toE164}
			invalidKey="invalidPhone"
			inputType="tel"
			placeholder="20 123 456"
			request={(phoneNumber) => authClient.phoneNumber.sendOtp({ phoneNumber })}
			confirm={(phoneNumber, code) =>
				// Attaches the number to the signed-in account instead of signing in.
				authClient.phoneNumber.verify({
					phoneNumber,
					code,
					updatePhoneNumber: true,
				})
			}
		/>
	);
}
