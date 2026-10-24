"use client";

import {
	BookOpen,
	FolderKanban,
	Receipt,
	StickyNote,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/initials";
import { formatPhone } from "@/lib/phone";
import { AskButton, type ToolOutput } from "./chat-ask";
import { InvoiceRowItem } from "./invoice-cards";
import {
	CardFrame,
	EmptyLine,
	NotFound,
	Pill,
	Rows,
	SectionTitle,
	useAssistantFormat,
} from "./primitives";
import { ProjectRowItem } from "./project-row";

function ClientAvatar({ name, image }: { name: string; image: string | null }) {
	return (
		<Avatar className="h-7 w-7 border border-border">
			<AvatarImage src={image ?? undefined} alt="" />
			<AvatarFallback className="bg-primary/10 text-[10px] text-primary">
				{initialsOf(name)}
			</AvatarFallback>
		</Avatar>
	);
}

const contactLine = (email: string, phone: string) =>
	[email, phone && formatPhone(phone)].filter(Boolean).join(" · ");

export function ClientListCard({
	data,
}: {
	data: ToolOutput<"search_clients">;
}) {
	const t = useTranslations("Assistant.cards");
	return (
		<CardFrame
			icon={Users}
			title={t("clients")}
			count={data.items.length}
			href="/dashboard/clients"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noResults")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((client) => (
						<li
							key={client.id}
							className="flex items-center gap-2.5 px-3 py-1.5"
						>
							<ClientAvatar name={client.name} image={client.image} />
							<Link
								href={`/dashboard/clients/${client.id}`}
								className="min-w-0 flex-1 hover:underline"
							>
								<p className="truncate text-sm font-medium">{client.name}</p>
								<p className="truncate text-xs text-muted-foreground">
									{contactLine(client.email, client.phone)}
								</p>
							</Link>
							<AskButton
								prompt={t("prompts.clientSummary", { name: client.name })}
							>
								{t("summary")}
							</AskButton>
						</li>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function ClientSummaryCard({
	data,
}: {
	data: ToolOutput<"client_summary">;
}) {
	const t = useTranslations("Assistant.cards");
	const tStatus = useTranslations("Bookings.status");
	const f = useAssistantFormat();
	if (!data.found) return <NotFound />;
	const { client, totals } = data;

	return (
		<CardFrame
			icon={Users}
			title={client.name}
			href={`/dashboard/clients/${client.id}`}
		>
			<div className="flex items-center gap-2.5 px-3 py-2.5">
				<ClientAvatar name={client.name} image={client.image} />
				<p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
					{contactLine(client.email, client.phone)}
				</p>
				<AskButton prompt={t("prompts.messageClient", { name: client.name })}>
					{t("message")}
				</AskButton>
			</div>
			<div className="grid grid-cols-4 divide-x divide-border/60 border-t border-border/70 text-center">
				{(
					[
						["projects", String(totals.projects)],
						["invoiced", f.money(totals.invoiced)],
						["collected", f.money(totals.paid)],
						["outstanding", f.money(totals.outstanding)],
					] as const
				).map(([key, value]) => (
					<div key={key} className="px-1.5 py-1.5">
						<p className="truncate text-[10px] text-muted-foreground uppercase">
							{t(key)}
						</p>
						<p className="truncate text-xs font-semibold tabular-nums">
							{value}
						</p>
					</div>
				))}
			</div>

			{client.notes && (
				<>
					<SectionTitle icon={StickyNote}>{t("notes")}</SectionTitle>
					<p className="line-clamp-4 px-3 py-2 text-xs whitespace-pre-wrap">
						{client.notes}
					</p>
				</>
			)}

			<SectionTitle icon={FolderKanban}>{t("projects")}</SectionTitle>
			{data.projects.length === 0 ? (
				<EmptyLine>{t("noProjects")}</EmptyLine>
			) : (
				<Rows>
					{data.projects.map((project) => (
						<ProjectRowItem key={project.id} project={project} />
					))}
				</Rows>
			)}

			{data.bookings.length > 0 && (
				<>
					<SectionTitle icon={BookOpen}>{t("bookings")}</SectionTitle>
					<Rows>
						{data.bookings.map((booking) => (
							<li key={booking.id}>
								<Link
									href={`/dashboard/bookings/${booking.id}`}
									className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50"
								>
									<span className="min-w-0 flex-1 truncate text-sm">
										{booking.title || booking.clientName}
									</span>
									<span className="text-xs text-muted-foreground">
										{f.day(booking.desiredDate)}
									</span>
									<Pill>{tStatus(booking.status)}</Pill>
								</Link>
							</li>
						))}
					</Rows>
				</>
			)}

			{data.invoices.length > 0 && (
				<>
					<SectionTitle icon={Receipt}>{t("invoices")}</SectionTitle>
					<Rows>
						{data.invoices.map((invoice) => (
							<InvoiceRowItem key={invoice.id} invoice={invoice} />
						))}
					</Rows>
				</>
			)}
		</CardFrame>
	);
}
