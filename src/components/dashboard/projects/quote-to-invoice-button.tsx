"use client";

import { Loader2, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { convertQuoteToInvoice } from "@/services/quotes/status-actions";

/** Turns the accepted quote into the project's invoice, with the same lines. */
export function QuoteToInvoiceButton({ quoteId }: { quoteId: string }) {
	const t = useTranslations("Projects.quote");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();

	return (
		<Button
			size="sm"
			className="h-7 gap-1.5 text-xs"
			disabled={pending}
			onClick={() =>
				startTransition(async () => {
					const result = await convertQuoteToInvoice(quoteId);
					if (!result.ok) return void toast.error(errorMessage(result.error));
					toast.success(t("converted"));
					router.push(`/dashboard/invoices/${result.data.invoiceId}`);
				})
			}
		>
			{pending ? (
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
			) : (
				<Receipt className="h-3.5 w-3.5" />
			)}
			{t("toInvoice")}
		</Button>
	);
}
