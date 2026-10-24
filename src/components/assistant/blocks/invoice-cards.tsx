"use client";

import { Receipt } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { InvoiceRow } from "@/lib/ai/assistant/tools/rows";
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

const STATUS_TONE: Record<InvoiceRow["status"], PillTone> = {
	DRAFT: "neutral",
	SENT: "primary",
	PAID: "success",
	CANCELLED: "neutral",
	OVERDUE: "danger",
};

export function InvoiceRowItem({ invoice }: { invoice: InvoiceRow }) {
	const tStatus = useTranslations("Invoices.status");
	const f = useAssistantFormat();
	return (
		<li>
			<Link
				href={`/dashboard/invoices/${invoice.id}`}
				className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-muted/50"
			>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">
						{invoice.number}
						<span className="font-normal text-muted-foreground">
							{" "}
							· {invoice.clientName}
						</span>
					</p>
					{invoice.dueDate && (
						<p className="text-xs text-muted-foreground">
							{f.day(invoice.dueDate)}
						</p>
					)}
				</div>
				<div className="text-right">
					<p className="text-sm font-medium tabular-nums">
						{f.money(invoice.total)}
					</p>
					{invoice.balance > 0 && invoice.balance < invoice.total && (
						<p className="text-[11px] text-muted-foreground tabular-nums">
							{f.money(invoice.balance)}
						</p>
					)}
				</div>
				<Pill tone={STATUS_TONE[invoice.status]}>
					{tStatus(invoice.status)}
				</Pill>
			</Link>
		</li>
	);
}

export function InvoiceListCard({
	data,
}: {
	data: ToolOutput<"list_invoices">;
}) {
	const t = useTranslations("Assistant.cards");
	const f = useAssistantFormat();
	return (
		<CardFrame
			icon={Receipt}
			title={t("invoices")}
			count={data.total}
			href="/dashboard/invoices"
		>
			<div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/70 text-center">
				{(
					[
						["invoiced", data.stats.invoiced],
						["collected", data.stats.collected],
						["outstanding", data.stats.outstanding],
					] as const
				).map(([key, value]) => (
					<div key={key} className="px-2 py-1.5">
						<p className="text-[10px] text-muted-foreground uppercase">
							{t(key)}
						</p>
						<p className="text-xs font-semibold tabular-nums">
							{f.money(value)}
						</p>
					</div>
				))}
			</div>
			{data.items.length === 0 ? (
				<EmptyLine>{t("noResults")}</EmptyLine>
			) : (
				<Rows>
					{data.items.map((invoice) => (
						<InvoiceRowItem key={invoice.id} invoice={invoice} />
					))}
				</Rows>
			)}
		</CardFrame>
	);
}

export function InvoiceDetailCard({
	data,
}: {
	data: ToolOutput<"get_invoice">;
}) {
	const t = useTranslations("Assistant.cards");
	const tStatus = useTranslations("Invoices.status");
	const f = useAssistantFormat();
	if (!data.found) return <NotFound />;
	const { invoice } = data;

	return (
		<CardFrame
			icon={Receipt}
			title={`${invoice.number} · ${invoice.clientName}`}
			href={`/dashboard/invoices/${invoice.id}`}
		>
			<Rows>
				{invoice.items.map((item, index) => (
					<li
						// biome-ignore lint/suspicious/noArrayIndexKey: lines have no id here.
						key={index}
						className="flex items-center gap-2 px-3 py-1 text-xs"
					>
						<span className="min-w-0 flex-1 truncate">
							{item.quantity !== 1 && `${item.quantity} × `}
							{item.description}
						</span>
						<span className="tabular-nums">{f.money(item.total)}</span>
					</li>
				))}
			</Rows>
			<div className="flex items-center gap-2 border-t border-border/70 px-3 py-2 text-xs">
				<Pill tone={STATUS_TONE[invoice.status]}>
					{tStatus(invoice.status)}
				</Pill>
				<span className="flex-1 text-muted-foreground">
					{t("paidOf", {
						paid: f.money(invoice.paid),
						total: f.money(invoice.total),
					})}
				</span>
				{invoice.status === "DRAFT" && (
					<AskButton
						variant="default"
						prompt={t("prompts.sendInvoice", { number: invoice.number })}
					>
						{t("send")}
					</AskButton>
				)}
				{(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
					<AskButton
						prompt={t("prompts.recordPayment", { number: invoice.number })}
					>
						{t("recordPayment")}
					</AskButton>
				)}
			</div>
		</CardFrame>
	);
}
