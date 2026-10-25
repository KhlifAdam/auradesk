"use client";

import { History, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRecentThreads } from "@/services/assistant/actions";
import type { ThreadSummary } from "@/services/assistant/types";
import { useAssistant } from "./assistant-provider";

/** The last few conversations, to pick one up again in the panel. */
export function HistoryMenu() {
	const t = useTranslations("Assistant.panel");
	const format = useFormatter();
	const { active, setActive, basePath } = useAssistant();
	const [threads, setThreads] = useState<ThreadSummary[] | null>(null);

	const load = (open: boolean) => {
		if (!open) return;
		setThreads(null);
		getRecentThreads()
			.then(setThreads)
			.catch(() => setThreads([]));
	};

	return (
		<DropdownMenu onOpenChange={load}>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className="h-7 w-7"
					aria-label={t("history")}
					title={t("history")}
				>
					<History className="h-3.5 w-3.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64">
				<DropdownMenuLabel className="text-xs">
					{t("history")}
				</DropdownMenuLabel>
				{threads === null ? (
					<div className="flex justify-center py-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				) : threads.length === 0 ? (
					<p className="px-2 py-2 text-xs text-muted-foreground">
						{t("noHistory")}
					</p>
				) : (
					threads.map((thread) => (
						<DropdownMenuItem
							key={thread.id}
							disabled={thread.id === active.id}
							onSelect={() => setActive({ id: thread.id, messages: null })}
							className="flex items-center gap-2"
						>
							<MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
							<span className="min-w-0 flex-1 truncate text-xs">
								{thread.title}
							</span>
							<span className="shrink-0 text-[10px] text-muted-foreground">
								{format.relativeTime(new Date(thread.updatedAt), new Date())}
							</span>
						</DropdownMenuItem>
					))
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href={basePath} className="text-xs">
						{t("allConversations")}
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
