"use client";

import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { MEDIA_TYPES, serviceChoices } from "@/services/projects/options";
import type { CreateProjectValues } from "@/services/projects/schemas";

export function GeneralSection() {
	const t = useTranslations("Projects.form");
	const tService = useTranslations("Projects.serviceTypes");
	const tMedia = useTranslations("Projects.mediaTypes");
	const { control } = useFormContext<CreateProjectValues>();
	const current = useWatch({ control, name: "serviceType" });

	return (
		<FormSection title={t("general.title")} description={t("general.hint")}>
			<TextField<CreateProjectValues>
				name="title"
				label={t("title")}
				placeholder={t("titlePlaceholder")}
			/>
			<div className="grid gap-3 sm:grid-cols-2">
				<SelectField<CreateProjectValues>
					name="serviceType"
					label={t("serviceType")}
					options={serviceChoices(current).map((value) => ({
						value,
						label: tService(value),
					}))}
				/>
				<SelectField<CreateProjectValues>
					name="mediaType"
					label={t("mediaType")}
					options={MEDIA_TYPES.map((value) => ({
						value,
						label: tMedia(value),
					}))}
				/>
			</div>
			<TextField<CreateProjectValues>
				name="description"
				label={t("descriptionLabel")}
				description={t("descriptionHint")}
				rows={3}
			/>
		</FormSection>
	);
}
