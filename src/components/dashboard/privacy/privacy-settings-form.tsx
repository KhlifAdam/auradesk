"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	SelectField,
	SwitchField,
} from "@/components/dashboard/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { updatePrivacySettings } from "@/services/privacy/actions";
import {
	type PrivacySettingsValues,
	privacySettingsSchema,
	RETENTION_CHOICES,
} from "@/services/privacy/schemas";

/** How long client galleries are kept, and whether photos keep their position. */
export function PrivacySettingsForm({
	values,
}: {
	values: PrivacySettingsValues;
}) {
	const t = useTranslations("Privacy.settings");
	const errorMessage = useErrorMessage();
	const form = useForm<PrivacySettingsValues>({
		resolver: zodResolver(privacySettingsSchema),
		defaultValues: values,
	});
	const { isSubmitting, isDirty } = form.formState;

	async function onSubmit(next: PrivacySettingsValues) {
		const result = await updatePrivacySettings(next);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("saved"));
		form.reset(next);
	}

	const options = RETENTION_CHOICES.filter(Boolean).map((months) => ({
		value: months,
		label: t("months", { count: Number(months) }),
	}));

	return (
		<section className="rounded-xl border border-border bg-card p-4">
			<h2 className="text-sm font-semibold">{t("title")}</h2>
			<p className="mb-3 text-xs text-muted-foreground">{t("description")}</p>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-3"
				>
					<SelectField<PrivacySettingsValues>
						name="retention"
						label={t("retention")}
						description={t("retentionHint")}
						emptyLabel={t("keepForever")}
						options={options}
						className="max-w-xs"
					/>
					<SwitchField<PrivacySettingsValues>
						name="stripLocation"
						label={t("stripLocation")}
						description={t("stripLocationHint")}
					/>
					<Button
						type="submit"
						size="sm"
						className="h-8 w-fit text-xs"
						disabled={isSubmitting || !isDirty}
					>
						{isSubmitting && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("save")}
					</Button>
				</form>
			</Form>
		</section>
	);
}
