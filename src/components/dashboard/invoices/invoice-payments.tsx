"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { deletePayment } from "@/services/invoices/payment-actions";
import type { InvoicePaymentDetail } from "@/services/invoices/types";
import { formatMoney } from "@/services/projects/money";

/** Money received on the invoice; a mistaken entry can be removed. */
export function InvoicePayments({
	invoiceId,
	payments,
	canEdit,
}: {
	invoiceId: string;
	payments: InvoicePaymentDetail[];
	canEdit: boolean;
}) {
	const t = useTranslations("Invoices.payments");
	const tMethod = useTranslations("Invoices.methods");
	const format = useFormatter();
	const locale = useLocale();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const remove = (paymentId: string) =>
		startTransition(async () => {
			const result = await deletePayment({ invoiceId, paymentId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("removed"));
			router.refresh();
		});

	return (
		<section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 print:hidden">
			<h2 className="text-xs font-medium text-muted-foreground">
				{t("history")}
			</h2>
			{payments.length === 0 ? (
				<p className="text-xs text-muted-foreground">{t("none")}</p>
			) : (
				<ul className="flex flex-col divide-y divide-border">
					{payments.map((payment) => (
						<li key={payment.id} className="flex items-center gap-2 py-1.5">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium tabular-nums">
									{formatMoney(payment.amount, locale)}
								</p>
								<p className="truncate text-[11px] text-muted-foreground">
									{format.dateTime(new Date(payment.paidAt), {
										dateStyle: "medium",
										timeZone: "UTC",
									})}{" "}
									· {tMethod(payment.method)}
									{payment.reference && ` · ${payment.reference}`}
								</p>
							</div>
							{canEdit && (
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-destructive"
									aria-label={t("remove")}
									disabled={isPending}
									onClick={() => remove(payment.id)}
								>
									{isPending ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Trash2 className="h-3.5 w-3.5" />
									)}
								</Button>
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
