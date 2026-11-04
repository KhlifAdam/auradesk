import "server-only";

import type { WhatsappStatus } from "@/generated/prisma/client";
import { ROLES } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { mailCopy, resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendMail } from "@/lib/mail/send-mail";
import { noticeEmail } from "@/lib/mail/templates/notice-email";
import { formatPhone } from "@/lib/phone";

const appUrl = (path: string) =>
	`${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;

/** Tells every administrator, in their language, that WhatsApp is not sending. */
export async function sendWhatsappAlert(
	status: Exclude<WhatsappStatus, "CONNECTED">,
	phone: string | null | undefined,
) {
	const admins = await db.user.findMany({
		where: { role: ROLES.admin, banned: { not: true } },
		select: { email: true, name: true, locale: true },
	});
	const url = appUrl("/admin/whatsapp");
	await Promise.all(
		admins.map(({ email, name, locale: saved }) => {
			const locale = resolveMailLocale(saved);
			const copy = mailCopy(locale).whatsappAlert;
			const vars = {
				name,
				number: phone ? formatPhone(phone) : copy.unknownNumber,
				cause: copy.causes[status],
			};
			return sendMail({ to: email, ...noticeEmail(copy, locale, vars, url) });
		}),
	);
}
