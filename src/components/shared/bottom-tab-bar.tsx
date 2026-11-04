"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabBarItem {
	key: string;
	label: string;
	icon: LucideIcon;
	active?: boolean;
	/** A link, or (without `href`) a button that runs `onClick`. */
	href?: string;
	onClick?: () => void;
	/** Small indicator over the icon, e.g. an unread count. */
	badge?: ReactNode;
}

/**
 * The phone's tab bar, shared by the studio and client spaces: the main places
 * under the thumb, the current one lit by a glowing line that glides across.
 * Hidden from the `lg` breakpoint up (or `md`, see `hideFrom`).
 */
export function BottomTabBar({
	label,
	items,
	pillId,
	hideFrom = "lg",
}: {
	label: string;
	items: TabBarItem[];
	/** Unique per bar, so two bars never share one gliding line. */
	pillId: string;
	hideFrom?: "md" | "lg";
}) {
	return (
		<nav
			aria-label={label}
			className={cn(
				"fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/75 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-18px_color-mix(in_oklab,var(--primary)_55%,transparent)] backdrop-blur-2xl print:hidden",
				hideFrom === "md" ? "md:hidden" : "lg:hidden",
			)}
		>
			<ul
				className="mx-auto grid max-w-lg"
				style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
			>
				{items.map((item) => {
					const Icon = item.icon;
					const className = cn(
						"relative flex w-full flex-col items-center gap-0.5 px-1 pt-2.5 pb-2 text-[11px] font-medium transition-colors duration-200",
						item.active ? "text-primary" : "text-muted-foreground",
					);
					const content = (
						<>
							{item.active && (
								<motion.span
									layoutId={pillId}
									transition={{ type: "spring", stiffness: 380, damping: 32 }}
									className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]"
								/>
							)}
							<span className="relative">
								<Icon
									className={cn(
										"h-5 w-5 transition-transform duration-300",
										item.active && "-translate-y-0.5 scale-110",
									)}
								/>
								{item.badge}
							</span>
							<span className="max-w-full truncate">{item.label}</span>
						</>
					);
					return (
						<li key={item.key}>
							{item.href ? (
								<Link
									href={item.href}
									aria-current={item.active ? "page" : undefined}
									className={className}
								>
									{content}
								</Link>
							) : (
								<button
									type="button"
									onClick={item.onClick}
									className={cn(className, "cursor-pointer")}
								>
									{content}
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
