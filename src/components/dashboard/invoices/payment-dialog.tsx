"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { PAYMENT_METHODS } from "@/services/invoices/options";
import { recordPayment } from "@/services/invoices/payment-actions";
import { type PaymentValues, paymentSchema } from "@/services/invoices/schemas";

const today = () => new Date().toISOString().slice(0, 10);

/** Records money received; starts at what is left to pay. */
export function PaymentDialog({
	invoiceId,
	balance,
}: {
	invoiceId: string;
	balance: number;
}) {
	const t = useTranslations("Invoices.payments");
	const tMethod = useTranslations("Invoices.methods");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const defaults = (): PaymentValues => ({
		invoiceId,
		amount: balance,
		paidAt: today(),
		method: "CASH",
		reference: "",
	});
	const form = useForm<PaymentValues>({
		resolver: zodResolver(paymentSchema),
		defaultValues: defaults(),
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: PaymentValues) {
		const result = await recordPayment(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("recorded"));
		setOpen(false);
		router.refresh();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(defaults());
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" className="h-7 gap-1.5 text-xs">
					<Banknote className="h-3.5 w-3.5" />
					{t("record")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						<div className="grid grid-cols-2 gap-3">
							<TextField<PaymentValues>
								name="amount"
								label={t("amount")}
								type="number"
								step="0.001"
								required
							/>
							<TextField<PaymentValues>
								name="paidAt"
								label={t("date")}
								type="date"
								required
							/>
						</div>
						<SelectField<PaymentValues>
							name="method"
							label={t("method")}
							options={PAYMENT_METHODS.map((value) => ({
								value,
								label: tMethod(value),
							}))}
						/>
						<TextField<PaymentValues>
							name="reference"
							label={t("reference")}
							placeholder={t("referencePlaceholder")}
						/>
						<DialogFooter>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
