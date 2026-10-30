import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { InvoiceStatusBadge } from "@/components/dashboard/invoices/invoice-status-badge";
import type { InvoiceDetail } from "@/services/invoices/types";
import { formatMoney } from "@/services/projects/money";
import { DocumentSheet, Row } from "./document-sheet";

/** The invoice as a sheet of paper, with what's left to pay. */
export async function InvoiceDocument({ invoice }: { invoice: InvoiceDetail }) {
	const t = await getTranslations("Invoices.document");
	const format = await getFormatter();
	const locale = await getLocale();
	const money = (value: number) => formatMoney(value, locale);
	const date = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "long", timeZone: "UTC" });
	const facts: [string, string][] = [[t("issued"), date(invoice.issueDate)]];
	if (invoice.dueDate) facts.push([t("due"), date(invoice.dueDate)]);
	if (invoice.projectTitle) facts.push([t("project"), invoice.projectTitle]);

	return (
		<DocumentSheet
			title={t("title")}
			number={invoice.number}
			badge={<InvoiceStatusBadge status={invoice.displayStatus} />}
			issuer={invoice.issuer}
			client={{
				name: invoice.clientName,
				email: invoice.clientEmail,
				phone: invoice.clientPhone,
				address: invoice.clientAddress,
			}}
			facts={facts}
			items={invoice.items}
			totals={invoice.totals}
			taxRate={invoice.taxRate}
			notes={invoice.notes}
			footer={
				<>
					{invoice.paid > 0 && (
						<Row label={t("paid")} value={`−${money(invoice.paid)}`} />
					)}
					{invoice.status !== "CANCELLED" && (
						<div className="flex justify-between font-semibold text-primary">
							<dt>{t("balance")}</dt>
							<dd className="tabular-nums">{money(invoice.balance)}</dd>
						</div>
					)}
				</>
			}
		/>
	);
}
