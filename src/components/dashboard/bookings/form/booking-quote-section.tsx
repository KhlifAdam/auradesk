"use client";

import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { Button } from "@/components/ui/button";
import type { BookingValues } from "@/services/bookings/schemas";
import { CURRENCY } from "@/services/projects/options";

const ADVANCE_PRESETS = [30, 50] as const;

export function BookingQuoteSection() {
	const t = useTranslations("Bookings.form.quote");
	const { control, setValue } = useFormContext<BookingValues>();
	const price = useWatch({ control, name: "proposedPrice" });

	return (
		<FormSection
			title={t("title")}
			description={t("hint", { currency: CURRENCY })}
		>
			<div className="grid gap-3 sm:grid-cols-3">
				<TextField<BookingValues>
					name="clientBudget"
					label={t("budget")}
					type="number"
					step="0.001"
				/>
				<TextField<BookingValues>
					name="proposedPrice"
					label={t("price")}
					required
					type="number"
					step="0.001"
				/>
				<TextField<BookingValues>
					name="plannedAdvance"
					label={t("advance")}
					type="number"
					step="0.001"
				/>
			</div>
			{price ? (
				<div className="-mt-1 flex flex-wrap items-center gap-1.5">
					<span className="text-xs text-muted-foreground">
						{t("advanceQuick")}
					</span>
					{ADVANCE_PRESETS.map((percent) => (
						<Button
							key={percent}
							type="button"
							size="sm"
							variant="outline"
							className="h-6 px-2 text-xs"
							onClick={() =>
								setValue(
									"plannedAdvance",
									Math.round(price * percent * 10) / 1000,
									{ shouldDirty: true },
								)
							}
						>
							{percent}%
						</Button>
					))}
				</div>
			) : null}
			<TextField<BookingValues>
				name="responseDeadline"
				label={t("deadline")}
				type="date"
				className="sm:max-w-xs"
			/>
			<TextField<BookingValues>
				name="internalNotes"
				label={t("notes")}
				description={t("notesHint")}
				rows={3}
			/>
		</FormSection>
	);
}
