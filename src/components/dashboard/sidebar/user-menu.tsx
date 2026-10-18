"use client";

import { LogOut, Settings, User as UserIcon, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { LanguageSubmenu } from "./language-submenu";
import { ThemeSubmenu } from "./theme-submenu";

interface UserMenuProps {
	user: {
		name: string;
		email: string;
		image?: string | null;
	};
}

export function UserMenu({ user }: UserMenuProps) {
	const t = useTranslations("Dashboard.UserMenu");
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await authClient.signOut();
			router.push("/login");
			router.refresh();
		} catch (error) {
			console.error("Failed to log out", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	const initials =
		user.name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase() || "U";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Avatar className="h-9 w-9 border border-border">
						<AvatarImage src={user.image ?? undefined} alt={user.name} />
						<AvatarFallback className="bg-primary/10 text-primary">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-1 flex-col overflow-hidden">
						<span className="truncate text-sm font-medium text-foreground">
							{user.name}
						</span>
						<span className="truncate text-xs text-muted-foreground">
							{user.email}
						</span>
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56"
				align="end"
				side="right"
				sideOffset={8}
			>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user.name}</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild className="cursor-pointer">
						<Link href="/dashboard/profile">
							<UserIcon className="mr-2 h-4 w-4" />
							<span>{t("profile")}</span>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild className="cursor-pointer">
						<Link href="/dashboard/settings">
							<Settings className="mr-2 h-4 w-4" />
							<span>{t("settings")}</span>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild className="cursor-pointer">
						<Link href="/portal">
							<UserRound className="mr-2 h-4 w-4" />
							<span>{t("clientSpace")}</span>
						</Link>
					</DropdownMenuItem>
					<LanguageSubmenu />
					<ThemeSubmenu />
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleLogout}
					disabled={isLoggingOut}
					className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>{isLoggingOut ? t("loggingOut") : t("logout")}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
