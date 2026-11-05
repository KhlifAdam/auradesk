"use client";

import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import type { BookingValues } from "@/services/bookings/schemas";
import { MEDIA_TYPES, serviceChoices } from "@/services/projects/options";
import { DurationPresets } from "./duration-presets";

export function BookingNeedSection() {
	const t = useTranslations("Bookings.form.need");
	const tService = useTranslations("Projects.serviceTypes");
	const tMedia = useTranslations("Projects.mediaTypes");
	const { control } = useFormContext<BookingValues>();
	const current = useWatch({ control, name: "serviceType" });

	return (
		<FormSection title={t("title")} description={t("hint")}>
			<div className="grid gap-3 sm:grid-cols-2">
				<SelectField<BookingValues>
					name="serviceType"
					label={t("serviceType")}
					options={serviceChoices(current).map((value) => ({
						value,
						label: tService(value),
					}))}
				/>
				<SelectField<BookingValues>
					name="mediaType"
					label={t("mediaType")}
					options={MEDIA_TYPES.map((value) => ({
						value,
						label: tMedia(value),
					}))}
				/>
			</div>
			<div className="grid items-start gap-3 sm:grid-cols-3">
				<TextField<BookingValues>
					name="desiredDate"
					label={t("date")}
					required
					type="date"
				/>
				<TextField<BookingValues>
					name="startTime"
					label={t("startTime")}
					required
					type="time"
				/>
				<div className="flex flex-col gap-1.5">
					<TextField<BookingValues>
						name="durationHours"
						label={t("duration")}
						type="number"
						step="0.5"
						min={1}
					/>
					<DurationPresets />
				</div>
			</div>
			<TextField<BookingValues>
				name="location"
				label={t("location")}
				required
				description={t("locationHint")}
			/>
			<TextField<BookingValues>
				name="description"
				label={t("description")}
				description={t("descriptionHint")}
				rows={3}
			/>
			<TextField<BookingValues>
				name="title"
				label={t("name")}
				description={t("nameHint")}
				placeholder={t("namePlaceholder")}
			/>
		</FormSection>
	);
}
