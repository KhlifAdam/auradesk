"use client";

import { useTranslations } from "next-intl";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { NAV_GROUPS } from "./nav-config";
import { NavItem } from "./nav-item";
import { SidebarLogo } from "./sidebar-logo";
import { UserMenu } from "./user-menu";

interface SidebarProps {
	studioName: string;
	unreadMessages: number;
	user: {
		name: string;
		email: string;
		image?: string | null;
	};
}

export function Sidebar({ studioName, unreadMessages, user }: SidebarProps) {
	const t = useTranslations("Dashboard.Nav");

	return (
		<aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-card print:hidden">
			{/* Logo */}
			<div className="border-b border-border p-3">
				<SidebarLogo name={studioName} />
			</div>

			{/* Navigation */}
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
									labelKey === "messages" && (
										<UnreadBadge side="photographer" initial={unreadMessages} />
									)
								}
								{...item}
							/>
						))}
					</div>
				))}
			</nav>

			{/* User / Footer */}
			<div className="border-t border-border p-2.5">
				<UserMenu user={user} />
			</div>
		</aside>
	);
}
