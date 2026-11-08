"use client";

import Link from "next/link";
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

/** AuraDesk on top, every place of the studio space, then who is signed in. */
export function SidebarContent({
	unreadMessages,
	user,
}: {
	unreadMessages: number;
	user: SidebarUser;
}) {
	const t = useTranslations("Dashboard.Nav");

	return (
		<>
			<div className="border-b border-border px-3 py-2.5">
				<Link
					href="/dashboard"
					className="block rounded-lg transition-opacity hover:opacity-90"
				>
					<SidebarLogo />
				</Link>
			</div>

			{/* Rows stretch to fill the height: no scroll on small screens, no gap at the bottom on tall ones. */}
			<nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2.5 py-2">
				{NAV_GROUPS.map((group) => (
					<div
						key={group.labelKey}
						className="flex flex-col gap-px"
						// Each group grows with its number of links, so spacing stays even.
						style={{ flexGrow: group.items.length }}
					>
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

			<div className="flex flex-col gap-2 border-t border-border p-2">
				<UserMenu user={user} />
			</div>
		</>
	);
}
