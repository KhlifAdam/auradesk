"use client";

import { SidebarContent, type SidebarUser } from "./sidebar-content";

interface SidebarProps {
	studioName: string;
	unreadMessages: number;
	user: SidebarUser;
}

/** The studio's side menu on large screens; phones and tablets use `DashboardMobileNav`. */
export function Sidebar(props: SidebarProps) {
	return (
		<aside className="hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-xl lg:flex print:hidden">
			<SidebarContent {...props} />
		</aside>
	);
}
