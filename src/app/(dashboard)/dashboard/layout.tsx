import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { TimeZoneSync } from "@/components/dashboard/time-zone-sync";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { BRAND_NAME } from "@/lib/brand";
import { getRequestTimeZone } from "@/lib/request-time-zone";
import { countUnread } from "@/services/messages/queries";
import { getStudioSummary } from "@/services/studio/queries";

export default async function DashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { session, photographerId } = await requirePhotographer();
	const [studio, timeZone, unreadMessages] = await Promise.all([
		getStudioSummary(photographerId),
		getRequestTimeZone(),
		countUnread({ id: photographerId, role: "photographer" }),
	]);

	return (
		<div className="flex h-screen overflow-hidden bg-background print:block print:h-auto print:overflow-visible">
			<TimeZoneSync serverTimeZone={timeZone} />
			<Sidebar
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
			<main className="relative flex flex-1 flex-col overflow-y-auto print:overflow-visible">
				{children}
			</main>
		</div>
	);
}
