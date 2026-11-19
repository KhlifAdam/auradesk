"use client";

import { HardDrive, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	type BillingCycleId,
	type PlanId,
	pricePerMonth,
	STORAGE_PACK,
	storageGbOf,
} from "@/services/billing/plans";

interface StoragePacksFieldProps {
	value: number;
	onChange: (value: number) => void;
	plan: PlanId;
	cycle: BillingCycleId;
}

/** Extra storage on top of the plan, chosen by packs of 100 GB. */
export function StoragePacksField({
	value,
	onChange,
	plan,
	cycle,
}: StoragePacksFieldProps) {
	const t = useTranslations("Billing.packs");
	// What the packs add to the monthly price, with the yearly discount applied.
	const extra = pricePerMonth(plan, cycle, value) - pricePerMonth(plan, cycle);
	const step = (delta: number) =>
		onChange(Math.min(STORAGE_PACK.max, Math.max(0, value + delta)));

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
			<div className="flex items-start gap-2.5">
				<HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<div className="flex flex-col gap-0.5">
					<span className="text-xs font-semibold">{t("title")}</span>
					<span className="text-[11px] text-muted-foreground">
						{t("description", {
							gb: STORAGE_PACK.gb,
							price: pricePerMonth(plan, cycle, 1) - pricePerMonth(plan, cycle),
						})}
					</span>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-7 w-7"
						aria-label={t("remove")}
						disabled={value === 0}
						onClick={() => step(-1)}
					>
						<Minus className="h-3.5 w-3.5" />
					</Button>
					<span className="w-16 text-center text-xs font-semibold tabular-nums">
						{t("short", { gb: value * STORAGE_PACK.gb })}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-7 w-7"
						aria-label={t("add")}
						disabled={value >= STORAGE_PACK.max}
						onClick={() => step(1)}
					>
						<Plus className="h-3.5 w-3.5" />
					</Button>
				</div>
				<span className="text-right text-[11px] text-muted-foreground">
					{t("total", { gb: storageGbOf(plan, value) })}
					{extra > 0 && (
						<>
							<br />
							{t("extraPrice", { amount: extra })}
						</>
					)}
				</span>
			</div>
		</div>
	);
}
