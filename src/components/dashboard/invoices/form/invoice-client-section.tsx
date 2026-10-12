"use client";

import { FolderKanban, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import { ClientPicker } from "@/components/dashboard/projects/form/client-picker";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { Button } from "@/components/ui/button";
import type { InvoiceValues } from "@/services/invoices/schemas";

/** Who is billed: picked from existing clients or typed, plus the linked project. */
export function InvoiceClientSection({
	projectTitle,
}: {
	projectTitle: string | null;
}) {
	const t = useTranslations("Invoices.form.client");
	const { setValue, control } = useFormContext<InvoiceValues>();
	const projectId = useWatch({ control, name: "projectId" });

	return (
		<FormSection title={t("title")} description={t("hint")}>
			{projectId && projectTitle && (
				<div className="flex w-fit items-center gap-1.5 rounded-lg border border-border bg-muted/50 py-1 pl-2.5 pr-1 text-xs">
					<FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
					{t("project", { title: projectTitle })}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						aria-label={t("unlink")}
						onClick={() => setValue("projectId", "", { shouldDirty: true })}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
			<div className="flex items-end gap-2">
				<TextField<InvoiceValues>
					name="clientName"
					label={t("name")}
					required
					className="flex-1"
				/>
				<ClientPicker
					onPick={(client) => {
						const options = { shouldDirty: true };
						setValue("clientId", client.id, options);
						setValue("clientName", client.name, options);
						setValue("clientEmail", client.email, options);
						setValue("clientPhone", client.phone, options);
					}}
				/>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<TextField<InvoiceValues>
					name="clientEmail"
					label={t("email")}
					description={t("emailHint")}
					type="email"
				/>
				<TextField<InvoiceValues>
					name="clientPhone"
					label={t("phone")}
					type="tel"
				/>
			</div>
			<TextField<InvoiceValues>
				name="clientAddress"
				label={t("address")}
				rows={2}
			/>
		</FormSection>
	);
}
