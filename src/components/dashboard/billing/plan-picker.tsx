"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SegmentedControl } from "@/components/dashboard/shared/segmented-control";
import { cn } from "@/lib/utils";
import type { BillingState, PlanChoice } from "@/services/billing/plan-change";
import {
	BILLING_CYCLES,
	PLAN_IDS,
	POPULAR_PLAN,
	pricePerMonth,
	pricePerPeriod,
} from "@/services/billing/plans";
import { PlanOutcome } from "./plan-outcome";
import { StoragePacksField } from "./storage-packs-field";

/**
 * Plan, billing and extra storage, with what the choice means underneath
 * (see PlanOutcome). Starts from the current plan; `onClose` when it was
 * opened from a paid plan's summary.
 */
export function PlanPicker({
	state,
	usedStorageGb,
	onClose,
}: {
	state: BillingState;
	usedStorageGb: number;
	onClose?: () => void;
}) {
	const t = useTranslations("Billing");
	const [choice, setChoice] = useState<PlanChoice>({
		plan: state.plan,
		cycle: state.cycle,
		storagePacks: state.storagePacks,
	});
	const set = (patch: Partial<PlanChoice>) =>
		setChoice((current) => ({ ...current, ...patch }));
	const { plan, cycle, storagePacks } = choice;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">
					{t(onClose ? "picker.changeTitle" : "picker.chooseTitle")}
				</h2>
				<SegmentedControl
					value={cycle}
					onChange={(value) => set({ cycle: value })}
					options={BILLING_CYCLES.map((id) => ({
						value: id,
						label: t(`cycles.${id}`),
					}))}
				/>
			</div>
			<div className="grid gap-2 sm:grid-cols-3">
				{PLAN_IDS.map((id) => {
					const selected = plan === id;
					const current = state.plan === id;
					return (
						<button
							key={id}
							type="button"
							aria-pressed={selected}
							onClick={() => set({ plan: id })}
							className={cn(
								"relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-all duration-200",
								selected
									? "border-primary bg-primary/5 ring-1 ring-primary"
									: "border-border hover:border-primary/50",
							)}
						>
							<span className="flex items-center justify-between gap-2 text-xs font-semibold">
								<span className="flex items-center gap-1.5">
									{t(`plans.${id}.name`)}
									{selected && <Check className="h-3.5 w-3.5 text-primary" />}
								</span>
								{current ? (
									<span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
										{t("picker.current")}
									</span>
								) : (
									id === POPULAR_PLAN && (
										<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
											{t("picker.popular")}
										</span>
									)
								)}
							</span>
							<span className="text-lg font-bold">
								{t("picker.perMonth", { amount: pricePerMonth(id, cycle) })}
							</span>
							<span className="text-[11px] text-muted-foreground">
								{t(`plans.${id}.summary`)}
							</span>
						</button>
					);
				})}
			</div>
			<StoragePacksField
				value={storagePacks}
				onChange={(value) => set({ storagePacks: value })}
				plan={plan}
				cycle={cycle}
			/>
			<p className="text-xs text-muted-foreground">
				{t(`picker.billed.${cycle}`, {
					amount: pricePerPeriod(plan, cycle, storagePacks),
				})}
			</p>
			<PlanOutcome
				state={state}
				next={choice}
				usedStorageGb={usedStorageGb}
				onClose={onClose}
			/>
		</div>
	);
}
