"use client";

import {
	CalendarDays,
	FolderKanban,
	LayoutGrid,
	Mail,
	Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { StudioCountBadge } from "../live-counts";
import { SidebarContent, type SidebarUser } from "../sidebar/sidebar-content";
import { SidebarLogo } from "../sidebar/sidebar-logo";

interface DashboardMobileNavProps {
	studioName: string;
	unreadMessages: number;
	user: SidebarUser;
}

/**
 * The studio space on phones and tablets: a slim top bar, the full menu in a
 * side sheet, and a tab bar with the places used every day.
 */
export function DashboardMobileNav({
	studioName,
	unreadMessages,
	user,
}: DashboardMobileNavProps) {
	const t = useTranslations("Dashboard.Nav");
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	// Going to a page closes the menu.
	useEffect(() => setOpen(false), [pathname]);

	const isActive = (href: string, exact = false) =>
		pathname === href || (!exact && pathname.startsWith(`${href}/`));

	return (
		<>
			<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-border/60 bg-background/70 px-2 backdrop-blur-2xl lg:hidden print:hidden">
				<Button
					variant="ghost"
					size="icon"
					aria-label={t("menu")}
					onClick={() => setOpen(true)}
				>
					<Menu className="h-5 w-5" />
				</Button>
				<Link href="/dashboard" className="min-w-0 flex-1">
					<SidebarLogo name={studioName} />
				</Link>
				<Button variant="ghost" size="icon" asChild>
					<Link
						href="/dashboard/messages"
						aria-label={t("messages")}
						className="relative"
					>
						<Mail className="h-5 w-5" />
						<UnreadBadge
							side="photographer"
							initial={unreadMessages}
							className="absolute top-1 right-0.5"
						/>
					</Link>
				</Button>
			</header>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="left"
					className="flex w-72 flex-col gap-0 bg-card p-0 sm:max-w-72"
				>
					<SheetTitle className="sr-only">{t("menu")}</SheetTitle>
					<SidebarContent
						studioName={studioName}
						unreadMessages={unreadMessages}
						user={user}
					/>
				</SheetContent>
			</Sheet>

			<BottomTabBar
				label={t("menu")}
				pillId="dashboard-bottom-pill"
				items={[
					{
						key: "overview",
						label: t("overview"),
						icon: LayoutGrid,
						href: "/dashboard",
						active: isActive("/dashboard", true),
					},
					{
						key: "calendar",
						label: t("calendar"),
						icon: CalendarDays,
						href: "/dashboard/calendar",
						active: isActive("/dashboard/calendar"),
					},
					{
						key: "projects",
						label: t("projects"),
						icon: FolderKanban,
						href: "/dashboard/projects",
						active: isActive("/dashboard/projects"),
						badge: (
							<StudioCountBadge
								kind="projects"
								className="absolute -top-1.5 -right-2.5"
							/>
						),
					},
					{
						key: "messages",
						label: t("messages"),
						icon: Mail,
						href: "/dashboard/messages",
						active: isActive("/dashboard/messages"),
						badge: (
							<UnreadBadge
								side="photographer"
								initial={unreadMessages}
								className="absolute -top-1.5 -right-2.5"
							/>
						),
					},
					{
						key: "menu",
						label: t("menu"),
						icon: Menu,
						onClick: () => setOpen(true),
					},
				]}
			/>
		</>
	);
}
