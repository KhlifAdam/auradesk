"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { LanguageSubmenu } from "@/components/dashboard/sidebar/language-submenu";
import { ThemeSubmenu } from "@/components/dashboard/sidebar/theme-submenu";
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
import { initialsOf } from "@/lib/initials";

interface SpaceHeaderProps {
	/** The space's name, already translated. */
	title: string;
	home: string;
	/** Rendered icon (a component can't cross from a server layout). */
	icon: ReactNode;
	user: { name: string; email: string; image?: string | null };
	/** Photographers get a way back to their own studio. */
	isPhotographer: boolean;
}

/** Top bar of a standalone space (team, admin): its name and the account menu. */
export function SpaceHeader({
	title,
	home,
	icon,
	user,
	isPhotographer,
}: SpaceHeaderProps) {
	const t = useTranslations("SpaceHeader");
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const logout = async () => {
		setIsLoggingOut(true);
		await authClient.signOut();
		router.push("/login");
		router.refresh();
	};

	return (
		<header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
				<Link href={home} className="flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
						{icon}
					</span>
					<span className="text-sm font-semibold">{title}</span>
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
							<p className="truncate text-xs text-muted-foreground">
								{user.email}
							</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{isPhotographer && (
							<DropdownMenuItem asChild className="cursor-pointer">
								<Link href="/dashboard">
									<LayoutDashboard className="mr-2 h-4 w-4" />
									{t("dashboard")}
								</Link>
							</DropdownMenuItem>
						)}
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
		</header>
	);
}
