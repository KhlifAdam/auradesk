import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { TimeZoneSync } from "@/components/dashboard/time-zone-sync";
import { PortalAssistant } from "@/components/portal/assistant/portal-assistant";
import { PortalHeader } from "@/components/portal/portal-header";
import { requireClient } from "@/lib/auth/require-client";
import { ROLES } from "@/lib/auth/roles";
import { BRAND_NAME } from "@/lib/brand";
import { realEmail } from "@/lib/phone";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { countUnread } from "@/services/messages/queries";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("Portal.header");
	return { title: `${t("title")} | ${BRAND_NAME}` };
}

export default async function PortalLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { session, clientId } = await requireClient();
	const [timeZone, unreadMessages] = await Promise.all([
		getRequestTimeZone(),
		countUnread({ id: clientId, role: "client" }),
	]);

	return (
		<div className="min-h-screen bg-background">
			<TimeZoneSync serverTimeZone={timeZone} />
			<div className="contents print:hidden">
				<PortalHeader
					user={{
						name: session.user.name,
						// A phone-only account's placeholder email never reaches the browser.
						email: realEmail(session.user.email) ?? "",
						phoneNumber: session.user.phoneNumber,
						image: session.user.image,
					}}
					unreadMessages={unreadMessages}
					isPhotographer={session.user.role === ROLES.photographer}
				/>
			</div>
			<main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
				{children}
			</main>
			<PortalAssistant />
		</div>
	);
}
