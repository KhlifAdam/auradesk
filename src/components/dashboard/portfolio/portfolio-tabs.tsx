"use client";

import { Images, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TABS = [
	{ id: "albums", href: "/dashboard/portfolio", icon: Images },
	{ id: "files", href: "/dashboard/portfolio/files", icon: Library },
] as const;

/** Albums (what the site shows) and all files (the library behind them). */
export function PortfolioTabs() {
	const t = useTranslations("Portfolio.tabs");
	const pathname = usePathname();

	return (
		<nav className="inline-flex h-9 w-fit items-center rounded-lg bg-muted p-1 text-muted-foreground">
			{TABS.map(({ id, href, icon: Icon }) => {
				const active = pathname === href;
				return (
					<Link
						key={id}
						href={href}
						aria-current={active ? "page" : undefined}
						className={cn(
							"inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all duration-200",
							active
								? "bg-background text-foreground shadow"
								: "hover:text-foreground",
						)}
					>
						<Icon className="h-3.5 w-3.5" />
						{t(id)}
					</Link>
				);
			})}
		</nav>
	);
}
