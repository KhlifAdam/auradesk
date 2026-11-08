"use client";

import { Ban, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/messages/types";
import { MessageAttachment } from "./message-attachment";

interface MessageBubbleProps {
	message: ChatMessage;
	mine: boolean;
	isNew: boolean;
	timeZone: string;
	onEdit: () => void;
	onDelete: () => Promise<void>;
}

/** One message; the sender's own can be edited or deleted from a small menu. */
export function MessageBubble({
	message,
	mine,
	isNew,
	timeZone,
	onEdit,
	onDelete,
}: MessageBubbleProps) {
	const t = useTranslations("Messages.bubble");
	const tDelete = useTranslations("Common.delete");
	const format = useFormatter();
	const [confirming, setConfirming] = useState(false);
	const [isPending, startTransition] = useTransition();
	const date = new Date(message.createdAt);
	const canChange = mine && !message.deleted;
	// A voice message has no text to change.
	const canEdit = canChange && message.attachment?.kind !== "VOICE";

	return (
		<div
			className={cn(
				"group flex items-center gap-1",
				mine ? "flex-row-reverse" : "flex-row",
			)}
		>
			<div
				className={cn(
					"max-w-[80%] rounded-2xl px-3 py-1.5 text-sm transition-[font-weight,background-color] duration-700",
					isNew && "font-bold ring-1 ring-primary/40",
					mine
						? "rounded-br-md bg-primary text-primary-foreground"
						: "rounded-bl-md bg-muted text-foreground",
					message.deleted &&
						"bg-transparent text-muted-foreground ring-1 ring-border",
				)}
			>
				{message.deleted ? (
					<p className="flex items-center gap-1.5 text-xs italic">
						<Ban className="h-3 w-3" />
						{t(mine ? "deletedMine" : "deleted")}
					</p>
				) : (
					<>
						{message.attachment && (
							<MessageAttachment attachment={message.attachment} mine={mine} />
						)}
						{message.body && (
							<p className="whitespace-pre-wrap break-words">{message.body}</p>
						)}
					</>
				)}
				<p
					className={cn(
						"mt-0.5 text-right text-[10px]",
						mine && !message.deleted
							? "text-primary-foreground/70"
							: "text-muted-foreground",
					)}
				>
					{message.editedAt && !message.deleted && `${t("edited")} · `}
					{format.dateTime(date, { timeStyle: "short", timeZone })}
				</p>
			</div>
			{canChange && (
				<DropdownMenu>
					<DropdownMenuTrigger
						className="rounded-full p-1 text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
						aria-label={t("actions")}
					>
						<MoreHorizontal className="h-4 w-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align={mine ? "end" : "start"}>
						{canEdit && (
							<DropdownMenuItem className="text-xs" onSelect={onEdit}>
								<Pencil className="h-3.5 w-3.5" />
								{t("edit")}
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							className="text-xs text-destructive focus:text-destructive"
							onSelect={() => setConfirming(true)}
						>
							<Trash2 className="h-3.5 w-3.5" />
							{t("delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>
							{tDelete("cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={(event) => {
								event.preventDefault();
								startTransition(async () => {
									await onDelete();
									setConfirming(false);
								});
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{tDelete("confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
