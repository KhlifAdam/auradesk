"use client";

import { CircleCheck, CircleDashed, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { setBookPaid } from "@/services/books/book-payment-actions";
import type { BookInvoice } from "@/services/books/types";
import {
	PAYMENT_METHODS,
	type PaymentMethod,
} from "@/services/invoices/options";
import { formatMoney } from "@/services/projects/money";

/** Paid / not paid at a glance, switchable in one click, with what is left to collect. */
export function BookPaymentCard({
	bookId,
	invoice,
}: {
	bookId: string;
	invoice: BookInvoice;
}) {
	const t = useTranslations("BookOrders.payment");
	const tMethods = useTranslations("Invoices.methods");
	const locale = useLocale();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [pending, startTransition] = useTransition();
	const [method, setMethod] = useState<PaymentMethod>("CASH");
	const paid = invoice.status === "PAID";
	const left = Math.max(0, invoice.total - invoice.paid);
	const money = (v: number) => formatMoney(v, locale);
	const locked = invoice.status === "CANCELLED" || invoice.status === "DRAFT";

	const set = (next: boolean) => {
		if (next === paid || locked) return;
		startTransition(async () => {
			const result = await setBookPaid({ id: bookId, paid: next, method });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(next ? t("markedPaid") : t("markedUnpaid"));
			router.refresh();
		});
	};

	const option = (value: boolean, label: string, Icon: typeof CircleCheck) => (
		<button
			type="button"
			aria-pressed={paid === value}
			disabled={pending || locked}
			onClick={() => set(value)}
			className={cn(
				"flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 disabled:cursor-default",
				paid === value
					? value
						? "bg-success text-white shadow-sm"
						: "bg-card text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{pending && paid !== value ? (
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
			) : (
				<Icon className="h-3.5 w-3.5" />
			)}
			{label}
		</button>
	);

	return (
		<div className="flex flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
			<div className="flex items-center justify-between gap-2 text-xs">
				<span className="font-medium">{t("title")}</span>
				<span className="text-muted-foreground">
					{paid
						? t("paidAll", { amount: money(invoice.total) })
						: t("left", { amount: money(left), total: money(invoice.total) })}
				</span>
			</div>
			<fieldset
				aria-label={t("title")}
				className="flex gap-1 rounded-lg border-0 bg-muted p-1"
			>
				{option(false, t("notPaid"), CircleDashed)}
				{option(true, t("paid"), CircleCheck)}
			</fieldset>
			{!paid && !locked && (
				<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
					<span>{t("method")}</span>
					<Select
						value={method}
						onValueChange={(v) => setMethod(v as PaymentMethod)}
					>
						<SelectTrigger className="h-7 w-36 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAYMENT_METHODS.map((m) => (
								<SelectItem key={m} value={m} className="text-xs">
									{tMethods(m)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
			<p className="text-[11px] text-muted-foreground">
				{paid ? t("paidHint") : t("unpaidHint")}
			</p>
		</div>
	);
}
