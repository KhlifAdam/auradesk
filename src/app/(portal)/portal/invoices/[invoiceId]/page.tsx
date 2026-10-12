import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { PrintButton } from "@/components/invoices/print-button";
import { requireClient } from "@/lib/auth/require-client";
import { getClientInvoice } from "@/services/invoices/queries";

/** An invoice the studio issued to the client, ready to print or save as PDF. */
export default async function PortalInvoicePage({
	params,
}: {
	params: Promise<{ invoiceId: string }>;
}) {
	const t = await getTranslations("Invoices.detail");
	const { invoiceId } = await params;
	const { clientId } = await requireClient();
	const invoice = await getClientInvoice(clientId, invoiceId);
	if (!invoice) notFound();

	return (
		<>
			<div className="flex items-center justify-between gap-2 print:hidden">
				<Link
					href={
						invoice.projectId
							? `/portal/projects/${invoice.projectId}`
							: "/portal"
					}
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<PrintButton />
			</div>
			<InvoiceDocument invoice={invoice} />
		</>
	);
}
