import "server-only";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { fromMillimes } from "@/lib/payments/types";
import { formatMoney } from "@/services/projects/money";
import { mailCopy, resolveMailLocale } from "./mail-copy";
import { sendMail } from "./send-mail";
import { noticeEmail } from "./templates/notice-email";

const subscriptionUrl = () =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}/dashboard/subscription`;

/**
 * To the photographer: a subscription payment was received (`receipt`), or
 * a renewal invoice is waiting to be paid (`renewal`).
 */
export async function sendBillingEmail(
	kind: "receipt" | "renewal",
	photographerId: string,
	invoice: { number: string; amountMillimes: number; date: Date },
) {
	const user = await db.user.findUnique({
		where: { id: photographerId },
		select: { email: true, name: true, locale: true },
	});
	if (!user) return;
	const locale = resolveMailLocale(user.locale);
	const copy = mailCopy(locale);
	await sendMail({
		to: user.email,
		...noticeEmail(
			kind === "receipt" ? copy.billingReceipt : copy.billingRenewal,
			locale,
			{
				name: user.name,
				number: invoice.number,
				amount: formatMoney(fromMillimes(invoice.amountMillimes), locale),
				date: invoice.date.toLocaleDateString(
					locale === "fr" ? "fr-FR" : "en-GB",
					{
						timeZone: "UTC",
					},
				),
			},
			subscriptionUrl(),
		),
	});
}
