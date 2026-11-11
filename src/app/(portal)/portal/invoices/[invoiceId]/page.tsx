import { ArrowLeft, BookImage, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { PrintButton } from "@/components/invoices/print-button";
import { requireClient } from "@/lib/auth/require-client";
import { getInvoiceBook } from "@/services/books/queries";
import { getClientInvoice } from "@/services/invoices/queries";
import { markInvoiceSeen } from "@/services/portal/seen";

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
	await markInvoiceSeen(clientId, invoice.id);
	const book = await getInvoiceBook(clientId, invoice.id);
	const tBook = await getTranslations("PhotoBook.change");

	return (
		<>
			<div className="flex items-center justify-between gap-2 print:hidden">
				<Link
					href={
						invoice.projectId
							? `/portal/projects/${invoice.projectId}`
							: "/portal/invoices"
					}
					className="flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					{t("back")}
				</Link>
				<PrintButton />
			</div>
			{book && (
				// Changes to the book are asked for and approved on the book itself.
				<Link
					href={`/portal/books/${book.id}`}
					className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors duration-200 hover:bg-muted/50 print:hidden"
				>
					<BookImage className="h-5 w-5 shrink-0 text-primary" />
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate font-medium">{book.title}</span>
						<span className="text-xs text-muted-foreground">
							{book.awaitingApprovalAt
								? tBook("invoiceAwaiting")
								: book.status === "SUBMITTED" || book.status === "ACCEPTED"
									? tBook("invoiceOpen")
									: tBook("invoiceClosed")}
						</span>
					</span>
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				</Link>
			)}
			<InvoiceDocument invoice={invoice} />
		</>
	);
}
