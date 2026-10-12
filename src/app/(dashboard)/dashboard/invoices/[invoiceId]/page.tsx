import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvoiceActions } from "@/components/dashboard/invoices/invoice-actions";
import { InvoicePayments } from "@/components/dashboard/invoices/invoice-payments";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { getInvoice } from "@/services/invoices/queries";

export default async function InvoicePage({
	params,
}: {
	params: Promise<{ invoiceId: string }>;
}) {
	const t = await getTranslations("Invoices.detail");
	const { invoiceId } = await params;
	const { photographerId } = await requirePhotographer();
	const invoice = await getInvoice(photographerId, invoiceId);
	if (!invoice) notFound();

	return (
		<PageShell className="print:p-0">
			<Link
				href="/dashboard/invoices"
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground print:hidden"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("back")}
			</Link>
			<div className="print:hidden">
				<PageHeader
					title={invoice.number}
					description={invoice.clientName}
					actions={
						<InvoiceActions
							invoiceId={invoice.id}
							status={invoice.status}
							balance={invoice.balance}
						/>
					}
				/>
			</div>
			{invoice.projectId && (
				<Link
					href={`/dashboard/projects/${invoice.projectId}`}
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground print:hidden"
				>
					{t("fromProject", { title: invoice.projectTitle ?? "" })}
					<ArrowUpRight className="h-3 w-3" />
				</Link>
			)}
			{invoice.status === "DRAFT" && (
				<p className="max-w-3xl rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground print:hidden">
					{t("draftHint")}
				</p>
			)}
			<div className="grid items-start gap-4 xl:grid-cols-[minmax(0,48rem)_18rem]">
				<InvoiceDocument invoice={invoice} />
				{invoice.status !== "DRAFT" && (
					<InvoicePayments
						invoiceId={invoice.id}
						payments={invoice.payments}
						canEdit={invoice.status !== "CANCELLED"}
					/>
				)}
			</div>
		</PageShell>
	);
}
