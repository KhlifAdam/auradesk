import "server-only";

import { db } from "@/lib/db";
import { resolveMailLocale } from "@/lib/mail/mail-copy";
import { sendProjectCreatedEmail } from "@/lib/mail/send-client-notices";
import { realEmail, toE164 } from "@/lib/phone";
import { sendProjectCreatedSms } from "@/lib/sms/send-client-sms";

/**
 * Tells a client who already accepted the booking that it is confirmed and the
 * project is ready: by email, or by text for a phone-only account. Never
 * throws; the result says whether the message left.
 */
export async function notifyProjectCreated(props: {
	clientId: string;
	photographerId: string;
	projectId: string;
	project: string;
	fallbackEmail: string | null;
	fallbackPhone: string | null;
}): Promise<boolean> {
	const { clientId, photographerId, projectId, project } = props;
	try {
		const [account, studio, photographer] = await Promise.all([
			db.user.findUnique({
				where: { id: clientId },
				select: { email: true, phoneNumber: true, locale: true },
			}),
			db.studio.findUnique({
				where: { photographerId },
				select: { name: true },
			}),
			db.user.findUnique({
				where: { id: photographerId },
				select: { name: true },
			}),
		]);
		const locale = resolveMailLocale(account?.locale);
		const studioName = studio?.name ?? photographer?.name ?? "";
		const path = `/portal/projects/${projectId}`;

		const email =
			(account && realEmail(account.email)) || props.fallbackEmail || null;
		if (email) {
			await sendProjectCreatedEmail({
				to: email,
				locale,
				studio: studioName,
				project,
				path,
			});
			return true;
		}
		const phone =
			account?.phoneNumber ??
			(props.fallbackPhone ? toE164(props.fallbackPhone) : null);
		if (!phone) return false;
		await sendProjectCreatedSms({
			to: phone,
			locale,
			studio: studioName,
			project,
			path,
		});
		return true;
	} catch (error) {
		console.error("Failed to tell the client their project is ready:", error);
		return false;
	}
}
