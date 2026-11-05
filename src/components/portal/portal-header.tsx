"use client";

import { motion } from "framer-motion";
import {
	Camera,
	LayoutDashboard,
	LogOut,
	Settings,
	UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSubmenu } from "@/components/dashboard/sidebar/language-submenu";
import { ThemeSubmenu } from "@/components/dashboard/sidebar/theme-submenu";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { BRAND_NAME } from "@/lib/brand";
import { initialsOf } from "@/lib/initials";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { NavCount } from "./nav-count";
import { isNavActive, PORTAL_NAV, type PortalNavCounts } from "./portal-nav";

interface PortalHeaderProps {
	user: {
		name: string;
		email: string;
		phoneNumber?: string | null;
		image?: string | null;
	};
	/** Photographers get a way back; others can open a studio. */
	isPhotographer: boolean;
	unreadMessages: number;
	/** Waiting items per nav entry (requests to answer, invitations). */
	counts: PortalNavCounts;
}

export function PortalHeader({
	user,
	isPhotographer,
	unreadMessages,
	counts,
}: PortalHeaderProps) {
	const t = useTranslations("Portal.header");
	const tNav = useTranslations("Portal.nav");
	const router = useRouter();
	const pathname = usePathname();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const logout = async () => {
		setIsLoggingOut(true);
		await authClient.signOut();
		router.push("/client/login");
		router.refresh();
	};

	return (
		<header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-2xl">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
				<Link href="/portal" className="group flex items-center gap-2.5">
					<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-sm font-bold text-primary-foreground shadow-luminous transition-transform duration-300 group-hover:scale-105">
						{BRAND_NAME[0]}
					</span>
					<span className="flex flex-col leading-none">
						<span className="text-sm font-semibold">{BRAND_NAME}</span>
						<span className="mt-0.5 text-[10px] font-medium tracking-wide text-primary uppercase">
							{t("title")}
						</span>
					</span>
				</Link>
				<nav className="hidden items-center gap-1 md:flex">
					{PORTAL_NAV.filter((item) => item.key !== "profile").map((item) => {
						const active = isNavActive(item, pathname);
						const Icon = item.icon;
						return (
							<Link
								key={item.key}
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200",
									active
										? "text-primary"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{active && (
									<motion.span
										layoutId="portal-header-pill"
										transition={{ type: "spring", stiffness: 380, damping: 32 }}
										className="absolute inset-0 rounded-lg bg-primary/10"
									/>
								)}
								<Icon className="relative h-4 w-4" />
								<span className="relative">{tNav(item.key)}</span>
								{item.key === "messages" && (
									<UnreadBadge
										side="client"
										initial={unreadMessages}
										className="relative"
									/>
								)}
								<NavCount count={counts[item.key]} className="relative" />
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-3">
					<DropdownMenu>
						<DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
							<Avatar className="h-8 w-8 border border-border">
								<AvatarImage src={user.image ?? undefined} alt={user.name} />
								<AvatarFallback className="bg-primary/10 text-xs text-primary">
									{initialsOf(user.name)}
								</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel className="font-normal">
								<p className="truncate text-sm font-medium">{user.name}</p>
								{user.email && (
									<p className="truncate text-xs text-muted-foreground">
										{user.email}
									</p>
								)}
								{user.phoneNumber && (
									<p className="truncate text-xs text-muted-foreground">
										{formatPhone(user.phoneNumber)}
									</p>
								)}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild className="cursor-pointer">
								<Link href="/portal/account">
									<UserRound className="mr-2 h-4 w-4" />
									{t("profile")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild className="cursor-pointer">
								<Link href="/portal/settings">
									<Settings className="mr-2 h-4 w-4" />
									{t("settings")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild className="cursor-pointer">
								{isPhotographer ? (
									<Link href="/dashboard">
										<LayoutDashboard className="mr-2 h-4 w-4" />
										{t("dashboard")}
									</Link>
								) : (
									<Link href="/start-studio">
										<Camera className="mr-2 h-4 w-4" />
										{t("createStudio")}
									</Link>
								)}
							</DropdownMenuItem>
							<LanguageSubmenu />
							<ThemeSubmenu />
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={logout}
								disabled={isLoggingOut}
								className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
							>
								<LogOut className="mr-2 h-4 w-4" />
								{t("logout")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
