"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createInvoice, updateInvoice } from "@/services/invoices/actions";
import { type InvoiceValues, invoiceSchema } from "@/services/invoices/schemas";
import { InvoiceClientSection } from "./invoice-client-section";
import { InvoiceItemsSection } from "./invoice-items-section";

interface InvoiceFormProps {
	initial: InvoiceValues;
	/** Title of the linked project, for its chip. */
	projectTitle: string | null;
	/** Edit mode when set. */
	invoiceId?: string;
	/** Where Cancel goes back to. */
	backHref: string;
}

export function InvoiceForm({
	initial,
	projectTitle,
	invoiceId,
	backHref,
}: InvoiceFormProps) {
	const t = useTranslations("Invoices.form");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<InvoiceValues>({
		resolver: zodResolver(invoiceSchema),
		defaultValues: initial,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: InvoiceValues) {
		if (invoiceId) {
			const result = await updateInvoice({ ...values, id: invoiceId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("updated"));
			router.push(`/dashboard/invoices/${invoiceId}`);
			return router.refresh();
		}
		const result = await createInvoice(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("created"));
		router.push(`/dashboard/invoices/${result.data.id}`);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex max-w-3xl flex-col gap-4"
			>
				<InvoiceClientSection projectTitle={projectTitle} />
				<InvoiceItemsSection />
				<FormSection title={t("details.title")}>
					<div className="grid gap-3 sm:grid-cols-2">
						<TextField<InvoiceValues>
							name="issueDate"
							label={t("details.issueDate")}
							type="date"
							required
						/>
						<TextField<InvoiceValues>
							name="dueDate"
							label={t("details.dueDate")}
							type="date"
						/>
					</div>
					<TextField<InvoiceValues>
						name="notes"
						label={t("details.notes")}
						description={t("details.notesHint")}
						rows={3}
					/>
				</FormSection>
				<div className="sticky bottom-4 z-20 flex justify-end gap-2 rounded-xl border border-border bg-card/80 p-3 backdrop-blur-md">
					<Button asChild type="button" variant="ghost" size="sm">
						<Link href={backHref}>{t("cancel")}</Link>
					</Button>
					<Button type="submit" size="sm" disabled={isSubmitting}>
						{isSubmitting && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{invoiceId ? t("save") : t("create")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
