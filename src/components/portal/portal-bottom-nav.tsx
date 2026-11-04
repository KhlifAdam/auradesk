"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { isNavActive, PORTAL_NAV } from "./portal-nav";

/** The phone's tab bar of the client space. */
export function PortalBottomNav({
	unreadMessages,
}: {
	unreadMessages: number;
}) {
	const t = useTranslations("Portal.nav");
	const pathname = usePathname();

	return (
		<BottomTabBar
			label={t("label")}
			pillId="portal-bottom-pill"
			hideFrom="md"
			items={PORTAL_NAV.map((item) => ({
				key: item.key,
				label: t(item.key),
				icon: item.icon,
				href: item.href,
				active: isNavActive(item, pathname),
				badge: item.key === "messages" && (
					<UnreadBadge
						side="client"
						initial={unreadMessages}
						className="absolute -top-1.5 -right-2.5"
					/>
				),
			}))}
		/>
	);
}
