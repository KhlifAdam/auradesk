"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
	SelectField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import {
	amountRemaining,
	formatMoney,
	suggestPaymentStatus,
} from "@/services/projects/money";
import { CURRENCY, PAYMENT_STATUSES } from "@/services/projects/options";
import type { CreateProjectValues } from "@/services/projects/schemas";

/** `discount`: what the project's issued invoices took off the price. */
export function FinanceSection({ discount = 0 }: { discount?: number }) {
	const t = useTranslations("Projects.form.finance");
	const tStatus = useTranslations("Projects.payment.status");
	const locale = useLocale();
	const { control, setValue } = useFormContext<CreateProjectValues>();
	const [price, advance] = useWatch({ control, name: ["price", "advance"] });
	const remaining = amountRemaining(price, advance, discount);

	// Follow the amounts as they are typed; a saved status is left alone until
	// the photographer edits an amount.
	const previous = useRef({ price, advance });
	useEffect(() => {
		if (
			previous.current.price === price &&
			previous.current.advance === advance
		)
			return;
		previous.current = { price, advance };
		const suggested = suggestPaymentStatus(price, advance, discount);
		if (suggested) setValue("paymentStatus", suggested, { shouldDirty: true });
	}, [price, advance, discount, setValue]);

	return (
		<FormSection
			title={t("title")}
			description={t("hint", { currency: CURRENCY })}
		>
			<div className="grid gap-3 sm:grid-cols-3">
				<TextField<CreateProjectValues>
					name="price"
					label={t("price")}
					type="number"
					step="any"
				/>
				<TextField<CreateProjectValues>
					name="advance"
					label={t("advance")}
					type="number"
					step="any"
				/>
				<div className="space-y-1">
					<p className="text-xs font-medium">{t("remaining")}</p>
					<div className="flex h-8 items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
						{remaining === null ? "—" : formatMoney(remaining, locale)}
					</div>
				</div>
			</div>
			<SelectField<CreateProjectValues>
				name="paymentStatus"
				label={t("status")}
				description={t("statusHint")}
				className="sm:max-w-xs"
				options={PAYMENT_STATUSES.map((value) => ({
					value,
					label: tStatus(value),
				}))}
			/>
			<TextField<CreateProjectValues>
				name="financialNotes"
				label={t("notes")}
				rows={2}
			/>
		</FormSection>
	);
}
