import { UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AssistantFab } from "@/components/assistant/assistant-fab";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { ASSISTANT_OPEN_COOKIE } from "@/components/assistant/open-cookie";
import { TimeZoneSync } from "@/components/dashboard/time-zone-sync";
import { SpaceHeader } from "@/components/shared/space-header";
import { requireTeamUser } from "@/lib/auth/require-team-user";
import { ROLES } from "@/lib/auth/roles";
import { BRAND_NAME } from "@/lib/brand";
import { realEmail } from "@/lib/phone";
import { getRequestTimeZone } from "@/lib/request-time-zone";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("TeamSpace.header");
	return { title: `${t("title")} | ${BRAND_NAME}` };
}

export default async function TeamLayout({
	children,
}: {
	children: ReactNode;
}) {
	const t = await getTranslations("TeamSpace.header");
	const { session } = await requireTeamUser();
	const timeZone = await getRequestTimeZone();
	const assistantOpen =
		(await cookies()).get(ASSISTANT_OPEN_COOKIE)?.value === "1";

	return (
		<AssistantProvider initialOpen={assistantOpen} basePath="/team/assistant">
			<div className="flex h-screen overflow-hidden bg-background">
				<div className="min-w-0 flex-1 overflow-y-auto">
					<TimeZoneSync serverTimeZone={timeZone} />
					<SpaceHeader
						title={t("title")}
						home="/team"
						icon={<UsersRound className="h-4 w-4" />}
						user={{
							name: session.user.name,
							email: realEmail(session.user.email) ?? "",
							image: session.user.image,
						}}
						isPhotographer={session.user.role === ROLES.photographer}
					/>
					<main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
						{children}
					</main>
				</div>
				<AssistantPanel team />
			</div>
			<AssistantFab />
		</AssistantProvider>
	);
}
