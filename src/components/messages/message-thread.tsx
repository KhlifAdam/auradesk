"use client";

import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PortfolioLink } from "@/components/portal/portfolio-link";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { dayKeyIn } from "@/services/calendar/dates";
import type { SentAttachment } from "@/services/messages/attachments";
import type { ChatMessage, Thread } from "@/services/messages/types";
import type { Viewer } from "@/services/messages/viewer";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { PartnerAvatar } from "./partner-avatar";
import { TypingBubble } from "./typing-indicator";
import { useThread } from "./use-thread";

const STICK_THRESHOLD_PX = 80;

interface MessageThreadProps {
	thread: Thread;
	viewer: Viewer;
	basePath: string;
	timeZone: string;
}

export function MessageThread({
	thread,
	viewer,
	basePath,
	timeZone,
}: MessageThreadProps) {
	const t = useTranslations("Messages.thread");
	const format = useFormatter();
	const errorMessage = useErrorMessage();
	const {
		messages,
		fresh,
		hasMore,
		isLoadingOlder,
		loadOlder,
		send,
		edit,
		remove,
		notifyTyping,
		partnerTyping,
	} = useThread(thread, viewer, basePath);
	const { partner } = thread;
	const [editing, setEditing] = useState<ChatMessage | null>(null);

	/** Sends a new message, or saves the one being edited. */
	async function submit(body: string, attachment: SentAttachment | null) {
		if (!editing) return send(body, attachment);
		const error = await edit(editing, body);
		if (!error) setEditing(null);
		return error;
	}

	async function deleteOne(message: ChatMessage) {
		const error = await remove(message);
		if (error) return void toast.error(errorMessage(error));
		if (editing?.id === message.id) setEditing(null);
	}

	const scroller = useRef<HTMLDivElement>(null);
	const stuckToBottom = useRef(true);
	const lastId = messages.at(-1)?.id;
	// Follow new messages unless the reader scrolled up.
	useLayoutEffect(() => {
		const el = scroller.current;
		if (el && stuckToBottom.current) el.scrollTop = el.scrollHeight;
	}, [lastId, partnerTyping]);

	async function showOlder() {
		const el = scroller.current;
		const before = el?.scrollHeight ?? 0;
		await loadOlder();
		// Keep the reader on the message they were looking at.
		requestAnimationFrame(() => {
			if (el) el.scrollTop += el.scrollHeight - before;
		});
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex items-center gap-2.5 border-b border-border px-3 py-2.5">
				<Button
					asChild
					variant="ghost"
					size="icon"
					className="h-8 w-8 md:hidden"
				>
					<Link href={basePath} aria-label={t("back")}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<PartnerAvatar partner={partner} />
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">
						{partner.studioName ?? partner.name}
					</p>
					{partnerTyping ? (
						<p className="truncate text-xs font-medium text-primary">
							{t("typing")}
						</p>
					) : (
						partner.studioName && (
							<p className="truncate text-xs text-muted-foreground">
								{partner.name}
							</p>
						)
					)}
				</div>
				{partner.siteSlug && (
					<PortfolioLink slug={partner.siteSlug} className="h-7 shrink-0" />
				)}
			</header>
			<div
				ref={scroller}
				onScroll={(event) => {
					const el = event.currentTarget;
					stuckToBottom.current =
						el.scrollHeight - el.scrollTop - el.clientHeight <
						STICK_THRESHOLD_PX;
				}}
				className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3"
			>
				{hasMore && (
					<Button
						variant="ghost"
						size="sm"
						className="mx-auto mb-2 h-7 text-xs"
						disabled={isLoadingOlder}
						onClick={showOlder}
					>
						{isLoadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{t("loadOlder")}
					</Button>
				)}
				{messages.length === 0 && (
					<div className="m-auto flex flex-col items-center gap-2 text-center">
						<MessageSquare className="h-5 w-5 text-muted-foreground" />
						<p className="text-xs text-muted-foreground">{t("empty")}</p>
					</div>
				)}
				{messages.map((message, index) => {
					const day = dayKeyIn(message.createdAt, timeZone);
					const previous = messages[index - 1];
					const newDay =
						!previous || dayKeyIn(previous.createdAt, timeZone) !== day;
					const mine = message.senderId === viewer.id;
					const isNew = fresh.has(message.id);
					const firstNew = isNew && !fresh.has(previous?.id ?? "");
					const date = new Date(message.createdAt);
					return (
						<Fragment key={message.id}>
							{newDay && (
								<p className="my-2 text-center text-[11px] font-medium text-muted-foreground">
									{format.dateTime(date, { dateStyle: "full", timeZone })}
								</p>
							)}
							{firstNew && (
								<div className="my-1 flex items-center gap-2 text-[11px] font-semibold text-primary">
									<span className="h-px flex-1 bg-primary/30" />
									{t("newMessages")}
									<span className="h-px flex-1 bg-primary/30" />
								</div>
							)}
							<MessageBubble
								message={message}
								mine={mine}
								isNew={isNew}
								timeZone={timeZone}
								onEdit={() => setEditing(message)}
								onDelete={() => deleteOne(message)}
							/>
						</Fragment>
					);
				})}
				{partnerTyping && <TypingBubble />}
			</div>
			<MessageComposer
				role={viewer.role}
				onSend={submit}
				onTyping={notifyTyping}
				editing={editing}
				onCancelEdit={() => setEditing(null)}
			/>
		</div>
	);
}
