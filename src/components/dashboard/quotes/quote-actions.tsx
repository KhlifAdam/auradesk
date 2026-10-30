"use client";

import { ArrowUpRight, Loader2, Pencil, Receipt, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/dashboard/shared/confirm-delete-button";
import { PrintButton } from "@/components/invoices/print-button";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { deleteQuote } from "@/services/quotes/actions";
import { canInvoiceQuote, type QuoteStatus } from "@/services/quotes/options";
import {
	convertQuoteToInvoice,
	sendQuote,
} from "@/services/quotes/status-actions";

interface QuoteActionsProps {
	quoteId: string;
	status: QuoteStatus;
	invoiceId: string | null;
}

/** What can be done with the quote now: send, edit, or turn it into an invoice. */
export function QuoteActions({
	quoteId,
	status,
	invoiceId,
}: QuoteActionsProps) {
	const t = useTranslations("Quotes.detail");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const send = () =>
		startTransition(async () => {
			const result = await sendQuote(quoteId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(result.data.emailed ? t("sentEmailed") : t("sent"));
			router.refresh();
		});

	const convert = () =>
		startTransition(async () => {
			const result = await convertQuoteToInvoice(quoteId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("converted"));
			router.push(`/dashboard/invoices/${result.data.invoiceId}`);
		});

	const spinner = <Loader2 className="h-3.5 w-3.5 animate-spin" />;

	return (
		<div className="flex flex-wrap items-center gap-2 print:hidden">
			{status === "DRAFT" && (
				<>
					<ConfirmDeleteButton
						title={t("deleteTitle")}
						description={t("deleteDescription")}
						onConfirm={async () => {
							const result = await deleteQuote(quoteId);
							if (!result.ok)
								return void toast.error(errorMessage(result.error));
							toast.success(t("deleted"));
							router.push("/dashboard/invoices/quotes");
						}}
					/>
					<Button
						size="sm"
						className="h-7 gap-1.5 text-xs"
						onClick={send}
						disabled={isPending}
					>
						{isPending ? spinner : <Send className="h-3.5 w-3.5" />}
						{t("send")}
					</Button>
				</>
			)}
			{canInvoiceQuote(status, invoiceId) && (
				<Button
					size="sm"
					className="h-7 gap-1.5 text-xs"
					onClick={convert}
					disabled={isPending}
				>
					{isPending ? spinner : <Receipt className="h-3.5 w-3.5" />}
					{t("convert")}
				</Button>
			)}
			{invoiceId && (
				<Button
					asChild
					size="sm"
					variant="outline"
					className="h-7 gap-1.5 text-xs"
				>
					<Link href={`/dashboard/invoices/${invoiceId}`}>
						{t("viewInvoice")}
						<ArrowUpRight className="h-3.5 w-3.5" />
					</Link>
				</Button>
			)}
			{!invoiceId && (status === "DRAFT" || status === "SENT") && (
				<Button
					asChild
					size="sm"
					variant="outline"
					className="h-7 gap-1.5 text-xs"
				>
					<Link href={`/dashboard/invoices/quotes/${quoteId}/edit`}>
						<Pencil className="h-3.5 w-3.5" />
						{t("edit")}
					</Link>
				</Button>
			)}
			<PrintButton />
		</div>
	);
}
