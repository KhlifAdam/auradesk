"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	type Control,
	Controller,
	type UseFormRegister,
	useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PriceList } from "@/lib/books/pricing";

type ListName = "covers" | "papers" | "extras";

interface Props {
	name: ListName;
	title: string;
	hint: string;
	control: Control<PriceList>;
	register: UseFormRegister<PriceList>;
	/** Covers and papers need at least one choice. */
	min: number;
}

/** An editable list of choices (name + extra price per copy). */
export function PriceOptionFields({
	name,
	title,
	hint,
	control,
	register,
	min,
}: Props) {
	const t = useTranslations("BookOrders.prices");
	const { fields, append, remove } = useFieldArray({ control, name });

	return (
		<fieldset className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
			<legend className="px-1 text-sm font-semibold">{title}</legend>
			<p className="text-xs text-muted-foreground">{hint}</p>
			{fields.map((field, index) => (
				<div key={field.id} className="flex items-center gap-2">
					<Input
						className="h-8 flex-1"
						aria-label={t("optionName")}
						{...register(`${name}.${index}.name`)}
					/>
					<Controller
						control={control}
						name={`${name}.${index}.price`}
						render={({ field: f }) => (
							<Input
								type="number"
								min={0}
								step="any"
								className="h-8 w-28"
								aria-label={t("optionPrice")}
								value={f.value}
								onChange={(e) => f.onChange(e.target.valueAsNumber || 0)}
							/>
						)}
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground"
						aria-label={t("remove")}
						disabled={fields.length <= min}
						onClick={() => remove(index)}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			))}
			{fields.length < 10 && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit gap-1.5"
					onClick={() =>
						append({ id: crypto.randomUUID().slice(0, 8), name: "", price: 0 })
					}
				>
					<Plus className="h-3.5 w-3.5" />
					{t("add")}
				</Button>
			)}
		</fieldset>
	);
}
