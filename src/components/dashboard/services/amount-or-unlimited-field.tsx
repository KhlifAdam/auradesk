"use client";

import { useFormContext, useWatch } from "react-hook-form";
import {
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PackageValues } from "@/services/packages/schemas";

type AmountKey = "durationMinutes" | "photoCount";
type UnlimitedKey = "unlimitedDuration" | "unlimitedPhotos";

interface AmountOrUnlimitedFieldProps {
	name: AmountKey;
	unlimitedName: UnlimitedKey;
	label: string;
	unit: string;
	unlimitedLabel: string;
	hint?: string;
	/** Stored value per unit shown, e.g. 60 to type hours and store minutes. */
	scale?: number;
	step?: number;
}

/** A number, or "unlimited" which clears and locks it. */
export function AmountOrUnlimitedField({
	name,
	unlimitedName,
	label,
	unit,
	unlimitedLabel,
	hint,
	scale = 1,
	step = 1,
}: AmountOrUnlimitedFieldProps) {
	const { control, setValue } = useFormContext<PackageValues>();
	const [stored, unlimited] = useWatch({
		control,
		name: [name, unlimitedName],
	});
	const shown =
		stored === null ? "" : String(Number((stored / scale).toFixed(2)));

	return (
		<FormField
			control={control}
			name={name}
			render={() => (
				<FormItem className="space-y-1">
					<Label htmlFor={name} className="text-xs">
						{label}
					</Label>
					<div className="flex items-center gap-3">
						<div className="relative flex-1">
							<Input
								id={name}
								type="number"
								min={0}
								step={step}
								value={unlimited ? "" : shown}
								disabled={unlimited}
								placeholder={unlimited ? unlimitedLabel : undefined}
								onChange={(event) => {
									const value = event.target.value;
									setValue(
										name,
										value === "" ? null : Math.round(Number(value) * scale),
										{ shouldDirty: true, shouldValidate: true },
									);
								}}
								className="h-8 pr-14 text-sm"
							/>
							<span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
								{unit}
							</span>
						</div>
						<Label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-normal">
							<Switch
								checked={unlimited}
								onCheckedChange={(checked) => {
									setValue(unlimitedName, checked, { shouldDirty: true });
									if (checked) setValue(name, null, { shouldValidate: true });
								}}
							/>
							{unlimitedLabel}
						</Label>
					</div>
					{hint && (
						<FormDescription className="text-xs">{hint}</FormDescription>
					)}
					<FormMessage className="text-xs" />
				</FormItem>
			)}
		/>
	);
}
