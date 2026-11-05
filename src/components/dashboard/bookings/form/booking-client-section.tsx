"use client";

import { UserCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import {
	ClientPicker,
	type PickedClient,
} from "@/components/dashboard/projects/form/client-picker";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { Button } from "@/components/ui/button";
import { BOOKING_SOURCES } from "@/services/bookings/options";
import type { BookingValues } from "@/services/bookings/schemas";

export function BookingClientSection() {
	const t = useTranslations("Bookings.form.client");
	const tSource = useTranslations("Bookings.source");
	const { setValue, control } = useFormContext<BookingValues>();
	const clientId = useWatch({ control, name: "clientId" });
	const pick = (client: PickedClient) => {
		const options = { shouldDirty: true };
		setValue("clientId", client.id, options);
		setValue("clientName", client.name, options);
		setValue("clientEmail", client.email, options);
		setValue("clientPhone", client.phone, options);
	};

	return (
		<FormSection title={t("title")} description={t("hint")}>
			{clientId ? (
				<div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
					<p className="flex items-center gap-2 text-xs font-medium">
						<UserCheck className="h-4 w-4 text-primary" />
						{t("linked")}
					</p>
					<div className="flex items-center gap-1">
						<ClientPicker onPick={pick} />
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							aria-label={t("unlink")}
							onClick={() => setValue("clientId", "", { shouldDirty: true })}
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			) : (
				<div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
					<p className="text-xs text-muted-foreground">{t("newClientHint")}</p>
					<ClientPicker onPick={pick} />
				</div>
			)}
			<TextField<BookingValues> name="clientName" label={t("name")} required />
			<div className="grid gap-3 sm:grid-cols-2">
				<TextField<BookingValues>
					name="clientEmail"
					label={t("email")}
					type="email"
				/>
				<TextField<BookingValues>
					name="clientPhone"
					label={t("phone")}
					type="tel"
					placeholder="+216 …"
				/>
			</div>
			<p className="-mt-1 text-xs text-muted-foreground">{t("contactHint")}</p>
			<SelectField<BookingValues>
				name="source"
				label={t("source")}
				description={t("sourceHint")}
				className="sm:max-w-xs"
				options={BOOKING_SOURCES.filter((value) => value !== "PORTAL").map(
					(value) => ({
						value,
						label: tSource(value),
					}),
				)}
			/>
		</FormSection>
	);
}
