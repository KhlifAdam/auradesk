"use client";

import {
	BookImage,
	Mail,
	MapPin,
	Phone,
	Receipt,
	Send,
	Store,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ToolOutput } from "./chat-ask";
import { Row } from "./client-space-cards";
import {
	CardFrame,
	EmptyLine,
	Pill,
	type PillTone,
	Rows,
	useAssistantFormat,
} from "./primitives";

const INVOICE_TONE: Record<string, PillTone> = {
	PAID: "success",
	SENT: "warning",
	OVERDUE: "danger",
};

export function ClientInvoicesCard({
	data,
}: {
	data: ToolOutput<"client_invoices">;
}) {
	const t = useTranslations("Assistant.client");
	const fmt = useAssistantFormat();
	return (
		<CardFrame
			icon={Receipt}
			title={t("invoices")}
			count={data.items.length}
			href="/portal/invoices"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noInvoices")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((i) => (
						<Row
							key={i.id}
							href={`/portal/invoices/${i.id}`}
							title={`${i.number}${i.about ? ` · ${i.about}` : ""}`}
							subtitle={i.studio}
						>
							<Pill tone={INVOICE_TONE[i.status] ?? "neutral"}>
								{t(
									`invoiceStatus.${i.status === "OVERDUE" ? "OVERDUE" : i.status === "PAID" ? "PAID" : "SENT"}`,
								)}
							</Pill>
							<span className="shrink-0 font-semibold tabular-nums">
								{fmt.money(i.balance > 0 ? i.balance : i.total)}
							</span>
						</Row>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function ClientRequestsCard({
	data,
}: {
	data: ToolOutput<"client_requests">;
}) {
	const t = useTranslations("Assistant.client");
	const tStatus = useTranslations("Bookings.status");
	const fmt = useAssistantFormat();
	return (
		<CardFrame
			icon={Send}
			title={t("requests")}
			count={data.items.length}
			href="/portal/bookings"
		>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noRequests")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((b) => (
						<Row
							key={b.id}
							href={`/portal/bookings/${b.id}`}
							title={b.title}
							subtitle={[b.studioName, fmt.day(b.desiredDate)]
								.filter(Boolean)
								.join(" · ")}
						>
							<Pill tone="primary">{tStatus(b.status)}</Pill>
						</Row>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function ClientBooksCard({
	data,
}: {
	data: ToolOutput<"client_books">;
}) {
	const t = useTranslations("Assistant.client");
	const tStatus = useTranslations("PhotoBook.status");
	return (
		<CardFrame icon={BookImage} title={t("books")} count={data.items.length}>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noBooks")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((b) => (
						<Row
							key={b.id}
							href={`/portal/books/${b.id}`}
							title={b.title}
							subtitle={b.projectTitle}
						>
							<Pill tone={b.status === "DELIVERED" ? "success" : "primary"}>
								{tStatus(b.status)}
							</Pill>
						</Row>
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function StudioContactsCard({
	data,
}: {
	data: ToolOutput<"studio_contacts">;
}) {
	const t = useTranslations("Assistant.client");
	return (
		<CardFrame icon={Store} title={t("studios")} href="/portal/messages">
			{data.items.length === 0 ? (
				<EmptyLine>{t("noStudios")}</EmptyLine>
			) : (
				<ul className="flex flex-col divide-y divide-border/60">
					{data.items.map((s) => (
						<li key={s.name} className="flex flex-col gap-1 px-3 py-2 text-xs">
							<span className="font-medium">{s.name}</span>
							<span className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
								{s.email && (
									<a
										href={`mailto:${s.email}`}
										className="flex items-center gap-1 hover:text-foreground"
									>
										<Mail className="h-3 w-3" />
										{s.email}
									</a>
								)}
								{s.phone && (
									<a
										href={`tel:${s.phone}`}
										className="flex items-center gap-1 hover:text-foreground"
									>
										<Phone className="h-3 w-3" />
										{s.phone}
									</a>
								)}
								{s.city && (
									<span className="flex items-center gap-1">
										<MapPin className="h-3 w-3" />
										{s.city}
									</span>
								)}
								{s.site && (
									<Link href={s.site} className="text-primary hover:underline">
										{t("website")}
									</Link>
								)}
							</span>
						</li>
					))}
				</ul>
			)}
		</CardFrame>
	);
}
