"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BookingRow } from "@/lib/ai/assistant/tools/rows";
import { AskButton, type ToolOutput } from "./chat-ask";
import {
	CardFrame,
	EmptyLine,
	NotFound,
	Pill,
	type PillTone,
	Rows,
	useAssistantFormat,
} from "./primitives";

const STATUS_TONE: Record<BookingRow["status"], PillTone> = {
	NEW: "primary",
	DISCUSSION: "warning",
	QUOTE_SENT: "neutral",
	CONFIRMED: "success",
	DECLINED: "danger",
};

/** The next steps that make sense for a request in this status. */
function BookingButtons({ booking }: { booking: BookingRow }) {
	const t = useTranslations("Assistant.cards");
	const name = booking.title || booking.clientName;
	if (booking.status === "CONFIRMED" || booking.status === "DECLINED")
		return null;
	return (
		<div className="flex flex-wrap gap-1.5">
			<AskButton variant="default" prompt={t("prompts.approve", { name })}>
				{t("approve")}
			</AskButton>
			{booking.status !== "QUOTE_SENT" && (
				<AskButton prompt={t("prompts.sendQuote", { name })}>
					{t("sendQuote")}
				</AskButton>
			)}
			<AskButton variant="ghost" prompt={t("prompts.decline", { name })}>
				{t("decline")}
			</AskButton>
		</div>
	);
}

function BookingRowItem({ booking }: { booking: BookingRow }) {
	const tStatus = useTranslations("Bookings.status");
	const tService = useTranslations("Projects.serviceTypes");
	const f = useAssistantFormat();
	return (
		<li className="flex flex-col gap-1.5 px-3 py-2">
			<Link
				href={`/dashboard/bookings/${booking.id}`}
				className="group flex items-center gap-2"
			>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium group-hover:underline">
						{booking.title || booking.clientName}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{[
							booking.title && booking.clientName,
							tService(booking.serviceType),
							f.day(booking.desiredDate),
							f.money(booking.proposedPrice),
						]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				<Pill tone={STATUS_TONE[booking.status]}>
					{tStatus(booking.status)}
				</Pill>
			</Link>
			<BookingButtons booking={booking} />
		</li>
	);
}

export function BookingListCard({
	data,
}: {
	data: ToolOutput<"pending_bookings">;
}) {
	const t = useTranslations("Assistant.cards");
	return (
		<CardFrame
			icon={BookOpen}
			title={t("pendingBookings")}
			count={data.total}
			href="/dashboard/bookings"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noPending")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((booking) => (
						<BookingRowItem key={booking.id} booking={booking} />
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function BookingDetailCard({
	data,
}: {
	data: ToolOutput<"get_booking">;
}) {
	const t = useTranslations("Assistant.cards");
	const f = useAssistantFormat();
	if (!data.found) return <NotFound />;
	const { booking } = data;
	const facts = [
		[
			t("contact"),
			[booking.clientEmail, booking.clientPhone].filter(Boolean).join(" · "),
		],
		[t("where"), booking.location],
		[t("budget"), f.money(booking.clientBudget)],
		[
			t("sentToClient"),
			booking.sentToClientAt ? f.day(booking.sentToClientAt) : "",
		],
		[
			t("clientAccepted"),
			booking.clientAcceptedAt ? f.day(booking.clientAcceptedAt) : "",
		],
	].filter(([, value]) => value);

	return (
		<CardFrame icon={BookOpen} title={booking.title || booking.clientName}>
			<Rows>
				<BookingRowItem booking={booking} />
			</Rows>
			{facts.length > 0 && (
				<dl className="flex flex-col gap-0.5 border-t border-border/70 px-3 py-2 text-xs">
					{facts.map(([label, value]) => (
						<div key={label} className="flex gap-2">
							<dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
							<dd className="min-w-0 break-words">{value}</dd>
						</div>
					))}
				</dl>
			)}
			{booking.description && (
				<p className="border-t border-border/70 px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">
					{booking.description}
				</p>
			)}
		</CardFrame>
	);
}
