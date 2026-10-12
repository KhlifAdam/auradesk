import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvoiceForm } from "@/components/dashboard/invoices/form/invoice-form";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { requirePhotographer } from "@/lib/auth/require-photographer";
import { invoiceToValues } from "@/services/invoices/form-values";
import { getInvoice } from "@/services/invoices/queries";

export default async function EditInvoicePage({
	params,
}: {
	params: Promise<{ invoiceId: string }>;
}) {
	const t = await getTranslations("Invoices.form");
	const { invoiceId } = await params;
	const { photographerId } = await requirePhotographer();
	const invoice = await getInvoice(photographerId, invoiceId);
	if (!invoice) notFound();
	const backHref = `/dashboard/invoices/${invoice.id}`;
	// Paid and cancelled invoices are final.
	if (invoice.status === "PAID" || invoice.status === "CANCELLED")
		redirect(backHref);

	return (
		<PageShell>
			<Link
				href={backHref}
				className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t("backToInvoice")}
			</Link>
			<PageHeader
				title={t("editTitle", { number: invoice.number })}
				description={t("description")}
			/>
			<InvoiceForm
				initial={invoiceToValues(invoice)}
				projectTitle={invoice.projectTitle}
				invoiceId={invoice.id}
				backHref={backHref}
			/>
		</PageShell>
	);
}
