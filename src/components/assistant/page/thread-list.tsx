"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useErrorMessage } from "@/hooks/use-error-message";
import { deleteThread, renameThread } from "@/services/assistant/actions";
import type { ThreadPage, ThreadSummary } from "@/services/assistant/types";
import { PageLink, ThreadRow } from "./thread-row";

interface ThreadListProps {
	threads: ThreadPage;
	activeId: string | null;
	basePath: string;
	onDeletedActive: () => void;
}

/** Past conversations, newest first, to reopen, rename or delete. */
export function ThreadList({
	threads,
	activeId,
	basePath,
	onDeletedActive,
}: ThreadListProps) {
	const t = useTranslations("Assistant.page");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [renaming, setRenaming] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<ThreadSummary | null>(null);
	const [pending, startTransition] = useTransition();

	const rename = (id: string, title: string) =>
		startTransition(async () => {
			const result = await renameThread({ id, title });
			setRenaming(null);
			if (!result.ok) toast.error(errorMessage(result.error));
			else router.refresh();
		});

	const remove = (thread: ThreadSummary) =>
		startTransition(async () => {
			const result = await deleteThread(thread.id);
			setDeleting(null);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("deleted"));
			if (thread.id === activeId) onDeletedActive();
			router.refresh();
		});

	return (
		<>
			<nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
				{threads.items.length === 0 && (
					<p className="px-2 py-3 text-xs text-muted-foreground">
						{t("noThreads")}
					</p>
				)}
				{threads.items.map((thread) =>
					renaming === thread.id ? (
						<input
							key={thread.id}
							defaultValue={thread.title}
							maxLength={80}
							// biome-ignore lint/a11y/noAutofocus: the user just asked to rename it.
							autoFocus
							disabled={pending}
							aria-label={t("rename")}
							className="rounded-lg border border-primary/50 bg-card px-2 py-1.5 text-sm outline-none"
							onBlur={(event) => rename(thread.id, event.currentTarget.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") event.currentTarget.blur();
								if (event.key === "Escape") setRenaming(null);
							}}
						/>
					) : (
						<ThreadRow
							key={thread.id}
							thread={thread}
							active={thread.id === activeId}
							href={`${basePath}/${thread.id}`}
							onRename={() => setRenaming(thread.id)}
							onDelete={() => setDeleting(thread)}
						/>
					),
				)}
			</nav>
			{threads.pageCount > 1 && (
				<div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
					<PageLink
						page={threads.page - 1}
						disabled={threads.page <= 1}
						basePath={basePath}
					>
						<ChevronLeft className="h-3.5 w-3.5" />
					</PageLink>
					{threads.page} / {threads.pageCount}
					<PageLink
						page={threads.page + 1}
						disabled={threads.page >= threads.pageCount}
						basePath={basePath}
					>
						<ChevronRight className="h-3.5 w-3.5" />
					</PageLink>
				</div>
			)}
			<AlertDialog
				open={deleting !== null}
				onOpenChange={(open) => !open && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteDescription", { title: deleting?.title ?? "" })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							disabled={pending}
							onClick={() => deleting && remove(deleting)}
						>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
