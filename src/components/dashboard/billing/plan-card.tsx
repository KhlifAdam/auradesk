"use client";

import { CalendarClock, HardDrive, Loader2, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { scheduleChange } from "@/services/billing/actions";
import {
	type BillingState,
	renewalOpensAt,
	renewalPlan,
	scheduledChange,
} from "@/services/billing/plan-change";
import { pricePerPeriod, STORAGE_PACK } from "@/services/billing/plans";
import { PlanPicker } from "./plan-picker";
import { RenewButton } from "./renew-button";

const card =
	"flex scroll-mt-20 flex-col gap-3 rounded-xl border border-border bg-card p-4";

/**
 * The plan section. Free month or ended: pick a plan and subscribe. Paid:
 * what you have and when it renews, Renew once it's due, and "Change plan
 * or storage" to see what a change costs before making it.
 */
export function PlanCard({
	state,
	canRenew,
	usedStorageGb,
	startOpen,
}: {
	state: BillingState;
	canRenew: boolean;
	usedStorageGb: number;
	startOpen: boolean;
}) {
	const t = useTranslations("Billing");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [changing, setChanging] = useState(startOpen);
	const [keeping, setKeeping] = useState(false);

	if (state.status !== "active" || !state.paidUntil)
		return (
			<section id="plan" className={card}>
				<PlanPicker state={state} usedStorageGb={usedStorageGb} />
			</section>
		);

	const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
	const paidUntil = date(state.paidUntil);
	const scheduled = scheduledChange(state);
	const renewal = renewalPlan(state);
	const renewalAmount = pricePerPeriod(
		renewal.plan,
		renewal.cycle,
		renewal.storagePacks,
	);

	async function keepCurrent() {
		setKeeping(true);
		const result = await scheduleChange({
			plan: state.plan,
			cycle: state.cycle,
			storagePacks: state.storagePacks,
		});
		setKeeping(false);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("current.kept"));
		router.refresh();
	}

	return (
		<section id="plan" className={card}>
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<h2 className="text-sm font-semibold">
						{t("picker.title")} · {t(`plans.${state.plan}.name`)}
					</h2>
					{state.storagePacks > 0 && (
						<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
							<HardDrive className="h-3 w-3" />
							{t("current.extraStorage", {
								gb: state.storagePacks * STORAGE_PACK.gb,
							})}
						</p>
					)}
					<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
						<CalendarClock className="h-3 w-3" />
						{t("current.paidUntil", { date: paidUntil })}
					</p>
				</div>
				<p className="text-sm font-semibold">
					{t("current.price", {
						price: pricePerPeriod(state.plan, state.cycle, state.storagePacks),
						cycle: state.cycle,
					})}
				</p>
			</div>

			{scheduled && (
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
					<span>
						{t("current.scheduled", {
							date: paidUntil,
							plan: t(`plans.${scheduled.plan}.name`),
							price: renewalAmount,
							cycle: scheduled.cycle,
						})}
					</span>
					<Button
						type="button"
						variant="link"
						size="sm"
						className="h-auto p-0 text-xs"
						disabled={keeping}
						onClick={keepCurrent}
					>
						{keeping && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
						{t("current.keep")}
					</Button>
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
				<p className="text-xs text-muted-foreground">
					{canRenew
						? t("current.renewDue", { date: paidUntil })
						: t("current.nextPayment", {
								amount: renewalAmount,
								date: paidUntil,
								from: date(renewalOpensAt(state.paidUntil)),
							})}
				</p>
				<div className="flex items-center gap-2">
					{!changing && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => setChanging(true)}
						>
							<Settings2 className="mr-1.5 h-3.5 w-3.5" />
							{t("current.change")}
						</Button>
					)}
					{canRenew && (
						<RenewButton
							label={t("current.renew", { amount: renewalAmount })}
						/>
					)}
				</div>
			</div>

			{changing && (
				<div className="border-t border-border pt-3">
					<PlanPicker
						state={state}
						usedStorageGb={usedStorageGb}
						onClose={() => setChanging(false)}
					/>
				</div>
			)}
		</section>
	);
}
