"use client";

import {
	Camera,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Settings,
	UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

export function PortalHeader({
	user,
	isPhotographer,
	unreadMessages,
}: PortalHeaderProps) {
	const t = useTranslations("Portal.header");
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const logout = async () => {
		setIsLoggingOut(true);
		await authClient.signOut();
		router.push("/client/login");
		router.refresh();
	};

	return (
		<header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
				<Link href="/portal" className="flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
						{BRAND_NAME[0]}
					</span>
					<span className="text-sm font-semibold">{t("title")}</span>
				</Link>
				<div className="flex items-center gap-3">
					<Link
						href="/portal/messages"
						className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
					>
						<MessageSquare className="h-4 w-4" />
						<span className="hidden sm:inline">{t("messages")}</span>
						<UnreadBadge side="client" initial={unreadMessages} />
					</Link>
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
