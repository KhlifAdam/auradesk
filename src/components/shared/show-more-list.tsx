"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A list that shows its first few rows, with a small grey button for the
 * rest, so a summary card stays short. Children are the `<li>` rows.
 */
export function ShowMoreList({
	children,
	initial = 3,
	className,
}: {
	children: ReactNode;
	/** Rows visible before "Show more". */
	initial?: number;
	className?: string;
}) {
	const t = useTranslations("Common.showMore");
	const [expanded, setExpanded] = useState(false);
	const rows = Children.toArray(children);
	const hidden = rows.length - initial;

	return (
		<>
			<ul className={className}>
				{expanded || hidden <= 0 ? rows : rows.slice(0, initial)}
			</ul>
			{hidden > 0 && (
				<button
					type="button"
					onClick={() => setExpanded((open) => !open)}
					aria-expanded={expanded}
					className="flex w-fit cursor-pointer items-center gap-1 self-start rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground"
				>
					{expanded ? t("less") : t("more", { count: hidden })}
					<ChevronDown
						className={cn(
							"h-3 w-3 transition-transform duration-200",
							expanded && "rotate-180",
						)}
					/>
				</button>
			)}
		</>
	);
}
