"use client";

import { Mail, Package, UsersRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AskButton, type ToolOutput } from "./chat-ask";
import {
	CardFrame,
	EmptyLine,
	Pill,
	Rows,
	useAssistantFormat,
} from "./primitives";

export function ConversationsCard({
	data,
}: {
	data: ToolOutput<"unread_messages">;
}) {
	const t = useTranslations("Assistant.cards");
	const f = useAssistantFormat();
	const unread = data.items.reduce((sum, c) => sum + c.unread, 0);
	return (
		<CardFrame
			icon={Mail}
			title={t("messages")}
			count={unread}
			href="/dashboard/messages"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noMessages")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((c) => (
						<li key={c.id} className="flex items-center gap-2 px-3 py-1.5">
							<Link
								href={`/dashboard/messages?c=${c.id}`}
								className="min-w-0 flex-1 hover:underline"
							>
								<p className="flex items-center gap-1.5 truncate text-sm font-medium">
									{c.clientName}
									{c.unread > 0 && <Pill tone="primary">{c.unread}</Pill>}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{c.lastFromMe && `${t("you")}: `}
									{c.preview}
								</p>
							</Link>
							<div className="flex shrink-0 flex-col items-end gap-1">
								{c.at && (
									<span className="text-[10px] text-muted-foreground">
										{f.relative(c.at)}
									</span>
								)}
								{c.unread > 0 && (
									<AskButton
										prompt={t("prompts.reply", { name: c.clientName })}
									>
										{t("reply")}
									</AskButton>
								)}
							</div>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function TeamCard({ data }: { data: ToolOutput<"team"> }) {
	const t = useTranslations("Assistant.cards");
	return (
		<CardFrame
			icon={UsersRound}
			title={t("team")}
			count={data.total}
			href="/dashboard/team"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noResults")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((m) => (
						<li key={m.id} className="flex items-center gap-2 px-3 py-1.5">
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{m.name}</p>
								<p className="truncate text-xs text-muted-foreground">
									{[m.specialty, t("projectCount", { count: m.projectCount })]
										.filter(Boolean)
										.join(" · ")}
								</p>
							</div>
							{m.status !== "ACCEPTED" && (
								<Pill tone={m.status === "PENDING" ? "warning" : "danger"}>
									{t(`invite.${m.status}`)}
								</Pill>
							)}
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function EquipmentCard({ data }: { data: ToolOutput<"equipment"> }) {
	const t = useTranslations("Assistant.cards");
	const tStatus = useTranslations("Equipment.statuses");
	const f = useAssistantFormat();
	return (
		<CardFrame
			icon={Package}
			title={t("equipment")}
			count={data.total}
			href="/dashboard/equipment"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noResults")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((e) => (
						<li key={e.id}>
							<Link
								href={`/dashboard/equipment/${e.id}`}
								className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{e.name}</p>
									{e.nextBooking && (
										<p className="truncate text-xs text-muted-foreground">
											{t("bookedFrom", {
												date: f.day(e.nextBooking.startDate),
											})}
										</p>
									)}
								</div>
								<Pill
									tone={
										e.status === "ACTIVE"
											? "success"
											: e.status === "BROKEN"
												? "danger"
												: "neutral"
									}
								>
									{tStatus(e.status)}
								</Pill>
							</Link>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}
