"use client";

import { getToolName, isToolUIPart } from "ai";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import type { AssistantUIMessage } from "@/lib/ai/assistant/tools";
import {
	isWriteTool,
	toolOutcome,
	type WriteToolInput,
	type WriteToolName,
	type WriteToolOutput,
} from "@/lib/ai/assistant/write-tools";
import { ActionCard } from "../actions/action-card";
import { BookingDetailCard, BookingListCard } from "../blocks/booking-cards";
import { ClientListCard, ClientSummaryCard } from "../blocks/client-cards";
import { AgendaCard, StatsCard, TodoCard } from "../blocks/insight-cards";
import { InvoiceDetailCard, InvoiceListCard } from "../blocks/invoice-cards";
import {
	ConversationsCard,
	EquipmentCard,
	TeamCard,
} from "../blocks/list-cards";
import { ProjectDetailCard, ProjectListCard } from "../blocks/project-cards";
import {
	AssignedProjectCard,
	AssignedProjectsCard,
} from "../blocks/team-space-cards";
import type { AssistantChat } from "./use-assistant-chat";

type Part = AssistantUIMessage["parts"][number];

// biome-ignore lint/suspicious/noExplicitAny: each card narrows its own output type.
const CARDS: Record<string, ComponentType<{ data: any }>> = {
	search_clients: ClientListCard,
	client_summary: ClientSummaryCard,
	list_projects: ProjectListCard,
	get_project: ProjectDetailCard,
	pending_bookings: BookingListCard,
	get_booking: BookingDetailCard,
	list_invoices: InvoiceListCard,
	get_invoice: InvoiceDetailCard,
	todo: TodoCard,
	agenda: AgendaCard,
	stats: StatsCard,
	unread_messages: ConversationsCard,
	team: TeamCard,
	equipment: EquipmentCard,
	my_projects: AssignedProjectsCard,
	get_assigned_project: AssignedProjectCard,
};

/** One tool call in an answer: a lookup's card, or a proposed change. */
export function ToolPart({
	part,
	settle,
}: {
	part: Part;
	settle: AssistantChat["settle"];
}) {
	const t = useTranslations("Assistant.working");
	if (!isToolUIPart(part)) return null;
	const name = getToolName(part);

	if (isWriteTool(name)) {
		const output =
			part.state === "output-available"
				? (part.output as WriteToolOutput)
				: part.state === "output-error"
					? toolOutcome.failed(part.errorText)
					: undefined;
		return (
			<ActionCard
				name={name}
				input={part.input as WriteToolInput<WriteToolName> | undefined}
				output={output}
				streaming={part.state === "input-streaming"}
				onSettle={(input) => settle(name, part.toolCallId, input)}
			/>
		);
	}

	if (part.state === "output-error")
		return (
			<p className="flex items-center gap-1.5 text-xs text-destructive">
				<AlertTriangle className="h-3.5 w-3.5" />
				{t("failed")}
			</p>
		);

	if (part.state !== "output-available")
		return (
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
				{t.has(name as "todo") ? t(name as "todo") : t("generic")}
			</p>
		);

	const Card = CARDS[name];
	return Card ? <Card data={part.output} /> : null;
}
