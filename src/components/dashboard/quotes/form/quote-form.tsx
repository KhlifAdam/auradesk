"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { InvoiceClientSection } from "@/components/dashboard/invoices/form/invoice-client-section";
import { InvoiceItemsSection } from "@/components/dashboard/invoices/form/invoice-items-section";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createQuote, updateQuote } from "@/services/quotes/actions";
import { type QuoteValues, quoteSchema } from "@/services/quotes/schemas";

interface QuoteFormProps {
	initial: QuoteValues;
	/** Title of the linked project, for its chip. */
	projectTitle: string | null;
	/** Edit mode when set. */
	quoteId?: string;
	/** Where Cancel goes back to. */
	backHref: string;
}

/** Same client and line sections as an invoice; the date is "valid until". */
export function QuoteForm({
	initial,
	projectTitle,
	quoteId,
	backHref,
}: QuoteFormProps) {
	const t = useTranslations("Quotes.form");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<QuoteValues>({
		resolver: zodResolver(quoteSchema),
		defaultValues: initial,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: QuoteValues) {
		if (quoteId) {
			const result = await updateQuote({ ...values, id: quoteId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("updated"));
			router.push(`/dashboard/invoices/quotes/${quoteId}`);
			return router.refresh();
		}
		const result = await createQuote(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("created"));
		router.push(`/dashboard/invoices/quotes/${result.data.id}`);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex max-w-3xl flex-col gap-4"
			>
				<InvoiceClientSection projectTitle={projectTitle} />
				<InvoiceItemsSection />
				<FormSection title={t("details")}>
					<div className="grid gap-3 sm:grid-cols-2">
						<TextField<QuoteValues>
							name="issueDate"
							label={t("issueDate")}
							type="date"
							required
						/>
						<TextField<QuoteValues>
							name="dueDate"
							label={t("validUntil")}
							type="date"
						/>
					</div>
					<TextField<QuoteValues>
						name="notes"
						label={t("notes")}
						description={t("notesHint")}
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
						{quoteId ? t("save") : t("create")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
