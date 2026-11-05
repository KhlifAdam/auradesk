import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AssistantFab } from "@/components/assistant/assistant-fab";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AssistantProvider } from "@/components/assistant/assistant-provider";
import { ASSISTANT_OPEN_COOKIE } from "@/components/assistant/open-cookie";
import { ExpiredGate } from "@/components/dashboard/billing/expired-gate";
import { SubscriptionBanner } from "@/components/dashboard/billing/subscription-banner";
import { StudioLiveRefresh } from "@/components/dashboard/live-counts";
import { DashboardMobileNav } from "@/components/dashboard/mobile-nav/dashboard-mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { TimeZoneSync } from "@/components/dashboard/time-zone-sync";
import { SpaceBackdrop } from "@/components/shared/space-backdrop";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { BRAND_NAME } from "@/lib/brand";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { getSubscription } from "@/services/billing/queries";
import { countUnread } from "@/services/messages/queries";
import { getStudioSummary } from "@/services/studio/queries";

export default async function DashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { session, photographerId } = await requirePhotographer();
	const [studio, timeZone, unreadMessages, subscription, cookieStore] =
		await Promise.all([
			getStudioSummary(photographerId),
			getRequestTimeZone(),
			countUnread({ id: photographerId, role: "photographer" }),
			getSubscription(photographerId),
			cookies(),
		]);
	const assistantOpen = cookieStore.get(ASSISTANT_OPEN_COOKIE)?.value === "1";

	return (
		<AssistantProvider
			initialOpen={assistantOpen}
			basePath="/dashboard/assistant"
		>
			<div className="relative isolate flex h-screen overflow-hidden bg-background print:block print:h-auto print:overflow-visible">
				<SpaceBackdrop />
				<TimeZoneSync serverTimeZone={timeZone} />
				<StudioLiveRefresh />
				<Sidebar
					studioName={studio?.name ?? BRAND_NAME}
					unreadMessages={unreadMessages}
					user={session.user}
				/>
				<div className="flex min-w-0 flex-1 flex-col">
					<DashboardMobileNav
						studioName={studio?.name ?? BRAND_NAME}
						unreadMessages={unreadMessages}
						user={session.user}
					/>
					{/*
				  `relative` is load-bearing: Radix form controls (checkbox, switch,
				  select, radio) render a hidden `position: absolute` native input.
				  Without a positioned ancestor it escapes this scroll container and
				  stretches the whole document, adding a second, outer scrollbar.
				*/}
					<main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-20 lg:pb-0 print:overflow-visible">
						<SubscriptionBanner subscription={subscription} />
						<ExpiredGate expired={subscription.status === "expired"}>
							{children}
						</ExpiredGate>
					</main>
				</div>
				<AssistantPanel team={false} />
			</div>
			<AssistantFab />
		</AssistantProvider>
	);
}
