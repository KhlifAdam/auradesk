"use client";

import { useTranslations } from "next-intl";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { StudioCountBadge } from "../live-counts";
import { NAV_GROUPS } from "./nav-config";
import { NavItem } from "./nav-item";
import { SidebarLogo } from "./sidebar-logo";
import { UserMenu } from "./user-menu";

export interface SidebarUser {
	name: string;
	email: string;
	image?: string | null;
}

/** Logo, every place of the studio space, and the account menu. */
export function SidebarContent({
	studioName,
	unreadMessages,
	user,
}: {
	studioName: string;
	unreadMessages: number;
	user: SidebarUser;
}) {
	const t = useTranslations("Dashboard.Nav");

	return (
		<>
			<div className="border-b border-border p-3">
				<SidebarLogo name={studioName} />
			</div>

			<nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2.5">
				{NAV_GROUPS.map((group) => (
					<div key={group.labelKey} className="flex flex-col gap-0.5">
						<span className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
							{t(group.labelKey)}
						</span>
						{group.items.map(({ labelKey, ...item }) => (
							<NavItem
								key={item.href}
								label={t(labelKey)}
								badge={
									labelKey === "messages" ? (
										<UnreadBadge side="photographer" initial={unreadMessages} />
									) : labelKey === "bookings" || labelKey === "projects" ? (
										<StudioCountBadge kind={labelKey} />
									) : null
								}
								{...item}
							/>
						))}
					</div>
				))}
			</nav>

			<div className="flex flex-col gap-2 border-t border-border p-2.5">
				<UserMenu user={user} />
			</div>
		</>
	);
}
