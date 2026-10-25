"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/hooks/use-error-message";
import { type PriceList, priceListSchema } from "@/lib/books/pricing";
import { savePriceList } from "@/services/books/price-actions";
import { PriceOptionFields } from "./price-option-fields";

const NUMBER_FIELDS = [
	{ name: "base.square", label: "baseSquare", step: "0.001" },
	{ name: "base.landscape", label: "baseLandscape", step: "0.001" },
	{ name: "base.portrait", label: "basePortrait", step: "0.001" },
	{ name: "includedPages", label: "includedPages", step: "1" },
	{ name: "extraSpreadPrice", label: "extraSpreadPrice", step: "0.001" },
	{ name: "minPages", label: "minPages", step: "1" },
	{ name: "leadTimeDays", label: "leadTimeDays", step: "1" },
] as const;

/** Edits the studio's book prices; everything is per copy. */
export function PriceListForm({ initial }: { initial: PriceList }) {
	const t = useTranslations("BookOrders.prices");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<PriceList>({
		resolver: zodResolver(priceListSchema),
		defaultValues: initial,
	});
	const { control, register, formState } = form;

	async function onSubmit(values: PriceList) {
		const result = await savePriceList(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("saved"));
		form.reset(values);
		router.refresh();
	}

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex max-w-2xl flex-col gap-4"
		>
			<div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
				<div className="flex flex-col gap-0.5">
					<span className="text-sm font-semibold">{t("enabled")}</span>
					<span className="text-xs text-muted-foreground">
						{t("enabledHint")}
					</span>
				</div>
				<Controller
					control={control}
					name="enabled"
					render={({ field }) => (
						<Switch
							checked={field.value}
							onCheckedChange={field.onChange}
							aria-label={t("enabled")}
						/>
					)}
				/>
			</div>

			<section className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
				<h2 className="text-sm font-semibold sm:col-span-2">{t("base")}</h2>
				{NUMBER_FIELDS.map(({ name, label, step }) => (
					<label
						key={name}
						htmlFor={`price-${name}`}
						className="flex flex-col gap-1 text-xs"
					>
						<span className="text-muted-foreground">{t(label)}</span>
						<Input
							type="number"
							min={0}
							step={step}
							id={`price-${name}`}
							className="h-8"
							{...register(name, { valueAsNumber: true })}
						/>
					</label>
				))}
			</section>

			<PriceOptionFields
				name="covers"
				title={t("covers")}
				hint={t("coversHint")}
				control={control}
				register={register}
				min={1}
			/>
			<PriceOptionFields
				name="papers"
				title={t("papers")}
				hint={t("papersHint")}
				control={control}
				register={register}
				min={1}
			/>
			<PriceOptionFields
				name="extras"
				title={t("extras")}
				hint={t("extrasHint")}
				control={control}
				register={register}
				min={0}
			/>

			{Object.keys(formState.errors).length > 0 && (
				<p className="text-xs text-destructive">{t("invalid")}</p>
			)}
			<Button
				type="submit"
				size="sm"
				className="w-fit gap-1.5"
				disabled={formState.isSubmitting || !formState.isDirty}
			>
				{formState.isSubmitting && (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				)}
				{t("save")}
			</Button>
		</form>
	);
}
