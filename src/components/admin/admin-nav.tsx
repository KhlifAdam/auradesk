"use client";

import { History, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TABS = [
	{ href: "/admin", key: "overview", icon: LayoutGrid },
	{ href: "/admin/activity", key: "activity", icon: History },
] as const;

/** Overview / Activity tabs of the admin space. */
export function AdminNav() {
	const t = useTranslations("Admin.nav");
	const pathname = usePathname();

	return (
		<nav className="inline-flex w-fit rounded-lg border border-border bg-card p-0.5">
			{TABS.map(({ href, key, icon: Icon }) => {
				// Account pages belong to the overview.
				const active =
					href === "/admin"
						? !pathname.startsWith("/admin/activity")
						: pathname.startsWith(href);
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all duration-200",
							active
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="h-3.5 w-3.5" />
						{t(key)}
					</Link>
				);
			})}
		</nav>
	);
}
