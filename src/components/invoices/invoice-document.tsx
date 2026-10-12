import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { InvoiceStatusBadge } from "@/components/dashboard/invoices/invoice-status-badge";
import type { InvoiceDetail } from "@/services/invoices/types";
import { formatMoney } from "@/services/projects/money";

/**
 * The invoice as a sheet of paper: issuer, client, lines, totals and what's
 * left to pay. It prints on its own (the app chrome is hidden for print).
 */
export async function InvoiceDocument({ invoice }: { invoice: InvoiceDetail }) {
	const t = await getTranslations("Invoices.document");
	const format = await getFormatter();
	const locale = await getLocale();
	const money = (value: number) => formatMoney(value, locale);
	const date = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "long", timeZone: "UTC" });
	const { issuer, totals } = invoice;
	const place = [issuer.city, issuer.country].filter(Boolean).join(", ");

	return (
		<article className="invoice-sheet flex max-w-3xl flex-col gap-6 rounded-xl border border-border bg-card p-6 text-sm print:max-w-none print:border-0 print:p-0">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex flex-col gap-0.5">
					<p className="font-display text-lg font-bold">{issuer.name}</p>
					{[issuer.email, issuer.phone, place].filter(Boolean).map((line) => (
						<p key={line} className="text-xs text-muted-foreground">
							{line}
						</p>
					))}
				</div>
				<div className="flex flex-col items-end gap-1 text-right">
					<p className="text-xs uppercase tracking-widest text-muted-foreground">
						{t("title")}
					</p>
					<p className="font-mono text-base font-semibold">{invoice.number}</p>
					<InvoiceStatusBadge status={invoice.displayStatus} />
				</div>
			</header>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-0.5">
					<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
						{t("billTo")}
					</p>
					<p className="font-medium">{invoice.clientName}</p>
					{[invoice.clientEmail, invoice.clientPhone, invoice.clientAddress]
						.filter(Boolean)
						.map((line) => (
							<p
								key={line}
								className="whitespace-pre-wrap text-xs text-muted-foreground"
							>
								{line}
							</p>
						))}
				</div>
				<dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:justify-self-end">
					<dt className="text-muted-foreground">{t("issued")}</dt>
					<dd>{date(invoice.issueDate)}</dd>
					{invoice.dueDate && (
						<>
							<dt className="text-muted-foreground">{t("due")}</dt>
							<dd>{date(invoice.dueDate)}</dd>
						</>
					)}
					{invoice.projectTitle && (
						<>
							<dt className="text-muted-foreground">{t("project")}</dt>
							<dd>{invoice.projectTitle}</dd>
						</>
					)}
				</dl>
			</div>

			<table className="w-full text-left">
				<thead>
					<tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
						<th className="py-2 font-medium">{t("description")}</th>
						<th className="py-2 text-right font-medium">{t("quantity")}</th>
						<th className="py-2 text-right font-medium">{t("unitPrice")}</th>
						<th className="py-2 text-right font-medium">{t("amount")}</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{invoice.items.map((item) => (
						<tr key={item.id}>
							<td className="py-2 pr-2">{item.description}</td>
							<td className="py-2 text-right tabular-nums">{item.quantity}</td>
							<td className="py-2 text-right tabular-nums">
								{money(item.unitPrice)}
							</td>
							<td className="py-2 text-right tabular-nums">
								{money(item.total)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-xs">
				<Row label={t("subtotal")} value={money(totals.subtotal)} />
				{totals.discount > 0 && (
					<Row label={t("discount")} value={`−${money(totals.discount)}`} />
				)}
				{invoice.taxRate > 0 && (
					<Row
						label={t("tax", { rate: invoice.taxRate })}
						value={money(totals.taxAmount)}
					/>
				)}
				<div className="mt-1 flex justify-between border-t border-border pt-1.5 text-sm font-semibold">
					<dt>{t("total")}</dt>
					<dd className="tabular-nums">{money(totals.total)}</dd>
				</div>
				{invoice.paid > 0 && (
					<Row label={t("paid")} value={`−${money(invoice.paid)}`} />
				)}
				{invoice.status !== "CANCELLED" && (
					<div className="flex justify-between font-semibold text-primary">
						<dt>{t("balance")}</dt>
						<dd className="tabular-nums">{money(invoice.balance)}</dd>
					</div>
				)}
			</dl>

			{invoice.notes && (
				<p className="whitespace-pre-wrap border-t border-border pt-3 text-xs text-muted-foreground">
					{invoice.notes}
				</p>
			)}
		</article>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="tabular-nums">{value}</dd>
		</div>
	);
}
