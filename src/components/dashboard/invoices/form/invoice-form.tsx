"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import {
	FORM_WITH_SIDE,
	FormSideActions,
} from "@/components/dashboard/shared/form-side-actions";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createInvoice, updateInvoice } from "@/services/invoices/actions";
import { type InvoiceValues, invoiceSchema } from "@/services/invoices/schemas";
import { InvoiceClientSection } from "./invoice-client-section";
import { InvoiceItemsSection } from "./invoice-items-section";
import {
	InvoiceProjectField,
	type LinkedProject,
} from "./invoice-project-field";

interface InvoiceFormProps {
	initial: InvoiceValues;
	/** The linked project, and what the prefilled lines are. */
	project: LinkedProject | null;
	/** Edit mode when set. */
	invoiceId?: string;
	/** Where Cancel goes back to. */
	backHref: string;
}

export function InvoiceForm({
	initial,
	project,
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
			<form onSubmit={form.handleSubmit(onSubmit)} className={FORM_WITH_SIDE}>
				<div className="flex flex-col gap-4">
					<InvoiceClientSection
						projectTitle={project?.title ?? null}
						projectField={<InvoiceProjectField initial={project} />}
					/>
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
				</div>
				<FormSideActions
					cancelHref={backHref}
					cancelLabel={t("cancel")}
					submitLabel={invoiceId ? t("save") : t("create")}
					submitting={isSubmitting}
				/>
			</form>
		</Form>
	);
}
