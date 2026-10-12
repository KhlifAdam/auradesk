"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { FormSection } from "@/components/dashboard/shared/form-section";
import { Button } from "@/components/ui/button";
import { MAX_INVOICE_ITEMS } from "@/services/invoices/options";
import type { InvoiceValues } from "@/services/invoices/schemas";
import { computeTotals, lineTotal } from "@/services/invoices/totals";
import { formatMoney } from "@/services/projects/money";
import { CURRENCY } from "@/services/projects/options";

/** The billed lines, discount and tax, with totals updated as you type. */
export function InvoiceItemsSection() {
	const t = useTranslations("Invoices.form.items");
	const locale = useLocale();
	const { control } = useFormContext<InvoiceValues>();
	const { fields, append, remove } = useFieldArray({ control, name: "items" });
	const [items, discount, taxRate] = useWatch({
		control,
		name: ["items", "discount", "taxRate"],
	});
	const totals = computeTotals(items ?? [], discount, taxRate);
	const money = (value: number) => formatMoney(value, locale);

	return (
		<FormSection
			title={t("title")}
			description={t("hint", { currency: CURRENCY })}
		>
			<div className="flex flex-col gap-2">
				{fields.map((field, index) => (
					<div
						key={field.id}
						className="grid grid-cols-[1fr_5rem_7rem_6rem_2rem] items-end gap-2"
					>
						<TextField<InvoiceValues>
							name={`items.${index}.description`}
							label={index === 0 ? t("description") : ""}
						/>
						<TextField<InvoiceValues>
							name={`items.${index}.quantity`}
							label={index === 0 ? t("quantity") : ""}
							type="number"
							step="0.01"
						/>
						<TextField<InvoiceValues>
							name={`items.${index}.unitPrice`}
							label={index === 0 ? t("unitPrice") : ""}
							type="number"
							step="0.001"
						/>
						<p className="flex h-8 items-center justify-end text-sm font-medium tabular-nums">
							{money(
								lineTotal(items?.[index] ?? { quantity: 0, unitPrice: 0 }),
							)}
						</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-destructive"
							aria-label={t("remove")}
							disabled={fields.length === 1}
							onClick={() => remove(index)}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				))}
			</div>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-7 w-fit gap-1.5 text-xs"
				disabled={fields.length >= MAX_INVOICE_ITEMS}
				onClick={() =>
					append({ description: "", quantity: 1, unitPrice: null })
				}
			>
				<Plus className="h-3.5 w-3.5" />
				{t("add")}
			</Button>
			<div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_16rem]">
				<div className="grid gap-3 sm:grid-cols-2 sm:self-start">
					<TextField<InvoiceValues>
						name="discount"
						label={t("discount")}
						type="number"
						step="0.001"
					/>
					<TextField<InvoiceValues>
						name="taxRate"
						label={t("taxRate")}
						type="number"
						step="0.01"
					/>
				</div>
				<dl className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
					{[
						[t("subtotal"), totals.subtotal],
						[t("discount"), -totals.discount],
						[t("tax"), totals.taxAmount],
					].map(([label, value]) => (
						<div key={label} className="flex justify-between text-xs">
							<dt className="text-muted-foreground">{label}</dt>
							<dd className="tabular-nums">{money(Number(value))}</dd>
						</div>
					))}
					<div className="mt-1 flex justify-between border-t border-border pt-1.5 font-semibold">
						<dt>{t("total")}</dt>
						<dd className="tabular-nums">{money(totals.total)}</dd>
					</div>
				</dl>
			</div>
		</FormSection>
	);
}
