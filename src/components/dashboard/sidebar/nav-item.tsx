"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
	href: string;
	label: string;
	icon: LucideIcon;
	exact?: boolean;
	/** Trailing indicator, e.g. an unread count. */
	badge?: ReactNode;
}

export function NavItem({
	href,
	label,
	icon: Icon,
	exact,
	badge,
}: NavItemProps) {
	const pathname = usePathname();
	const isActive =
		pathname === href || (!exact && pathname.startsWith(`${href}/`));

	return (
		<Link
			href={href}
			className={cn(
				// Rows share the sidebar's height (28–44px), so there is no empty space below.
				"flex max-h-11 min-h-7 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-all duration-200",
				isActive
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			<Icon
				className={cn(
					"h-4 w-4 shrink-0 transition-colors",
					isActive ? "text-primary" : "text-muted-foreground",
				)}
			/>
			<span className="flex-1">{label}</span>
			{badge}
		</Link>
	);
}
