import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { UrlPagination } from "@/components/dashboard/shared/url-pagination";
import { cn } from "@/lib/utils";
import { dayKeyIn, todayKey } from "@/services/calendar/dates";
import type { ConversationPage } from "@/services/messages/types";
import { PartnerAvatar } from "./partner-avatar";

interface ConversationListProps {
	conversations: ConversationPage;
	activeId: string | undefined;
	basePath: string;
	timeZone: string;
}

export async function ConversationList({
	conversations,
	activeId,
	basePath,
	timeZone,
}: ConversationListProps) {
	const t = await getTranslations("Messages.list");
	const format = await getFormatter();
	const today = todayKey(timeZone);

	if (conversations.total === 0) {
		return (
			<EmptyState
				icon={MessageSquare}
				title={t("emptyTitle")}
				description={t("emptyDescription")}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
				{conversations.items.map((conversation) => {
					const { partner, lastMessageAt, unread } = conversation;
					const sameDay =
						lastMessageAt && dayKeyIn(lastMessageAt, timeZone) === today;
					return (
						<li key={conversation.id}>
							<Link
								href={`${basePath}?c=${conversation.id}&page=${conversations.page}`}
								className={cn(
									"flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50",
									conversation.id === activeId && "bg-primary/5",
								)}
							>
								<PartnerAvatar partner={partner} />
								<div className="min-w-0 flex-1">
									<div className="flex items-baseline justify-between gap-2">
										<p
											className={cn(
												"truncate text-sm",
												unread > 0 ? "font-semibold" : "font-medium",
											)}
										>
											{partner.studioName ?? partner.name}
										</p>
										{lastMessageAt && (
											<span
												className={cn(
													"shrink-0 text-[11px]",
													unread > 0
														? "font-semibold text-foreground"
														: "text-muted-foreground",
												)}
											>
												{format.dateTime(
													new Date(lastMessageAt),
													sameDay
														? { timeStyle: "short", timeZone }
														: { dateStyle: "medium", timeZone },
												)}
											</span>
										)}
									</div>
									<div className="flex items-center justify-between gap-2">
										<p
											className={cn(
												"truncate text-xs",
												unread > 0
													? "font-bold text-foreground"
													: "text-muted-foreground",
											)}
										>
											{conversation.lastFromMe && `${t("you")} `}
											{conversation.preview || t("deleted")}
										</p>
										{unread > 0 && (
											<span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
												{unread > 99 ? "99+" : unread}
											</span>
										)}
									</div>
								</div>
							</Link>
						</li>
					);
				})}
			</ul>
			<UrlPagination
				page={conversations.page}
				pageCount={conversations.pageCount}
			/>
		</div>
	);
}
