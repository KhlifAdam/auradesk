"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ThreadSummary } from "@/services/assistant/types";

export function ThreadRow({
	thread,
	active,
	href,
	onRename,
	onDelete,
}: {
	thread: ThreadSummary;
	active: boolean;
	href: string;
	onRename: () => void;
	onDelete: () => void;
}) {
	const t = useTranslations("Assistant.page");
	const format = useFormatter();
	return (
		<div
			className={cn(
				"group flex items-center rounded-lg transition-colors",
				active ? "bg-primary/10 text-primary" : "hover:bg-muted",
			)}
		>
			<Link href={href} className="min-w-0 flex-1 px-2 py-1.5">
				<p className="truncate text-sm">{thread.title}</p>
				<p className="text-[10px] text-muted-foreground">
					{format.relativeTime(new Date(thread.updatedAt))}
				</p>
			</Link>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label={t("actions")}
					className="mr-1 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background focus-visible:opacity-100 data-[state=open]:opacity-100"
				>
					<MoreHorizontal className="h-3.5 w-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={onRename} className="text-xs">
						<Pencil className="h-3.5 w-3.5" />
						{t("rename")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={onDelete}
						className="text-xs text-destructive focus:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
						{t("delete")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function PageLink({
	page,
	disabled,
	basePath,
	children,
}: {
	page: number;
	disabled: boolean;
	basePath: string;
	children: ReactNode;
}) {
	if (disabled) return <span className="p-1 opacity-40">{children}</span>;
	return (
		<Link
			href={`${basePath}?page=${page}`}
			className="rounded-md p-1 hover:bg-muted"
		>
			{children}
		</Link>
	);
}
