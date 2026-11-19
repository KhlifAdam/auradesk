"use client";

import {
	AlertTriangle,
	CalendarClock,
	CreditCard,
	Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ActionResult } from "@/lib/action-result";
import { choosePlan, scheduleChange } from "@/services/billing/actions";
import { startCheckout } from "@/services/billing/checkout-actions";
import {
	type BillingState,
	type PlanChoice,
	planChange,
	samePlan,
} from "@/services/billing/plan-change";
import { pricePerPeriod, storageGbOf } from "@/services/billing/plans";
import { goToPayment } from "./go-to-payment";

/**
 * What the selected plan means before anything is paid: the amount, when it
 * applies and what comes after, with the one button that does it.
 */
export function PlanOutcome({
	state,
	next,
	usedStorageGb,
	onClose,
}: {
	state: BillingState;
	next: PlanChoice;
	usedStorageGb: number;
	onClose?: () => void;
}) {
	const t = useTranslations("Billing");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [busy, setBusy] = useState<"pay" | "save" | null>(null);
	const change = planChange(state, next);
	const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
	const price = pricePerPeriod(next.plan, next.cycle, next.storagePacks);
	const limit = storageGbOf(next.plan, next.storagePacks);

	async function run(
		kind: "pay" | "save",
		action: () => Promise<ActionResult<unknown>>,
		done?: string,
	) {
		setBusy(kind);
		const result = await action();
		if (!result.ok) {
			setBusy(null);
			return void toast.error(errorMessage(result.error));
		}
		const data = result.data as { payUrl?: string } | undefined;
		if (data?.payUrl)
			return goToPayment(data.payUrl, t("checkout.redirecting"));
		setBusy(null);
		if (done) toast.success(done);
		onClose?.();
		router.refresh();
	}

	const pay = (label: string) => (
		<Button
			type="button"
			size="sm"
			className="h-8 text-xs"
			disabled={!!busy}
			onClick={() => run("pay", () => startCheckout(next))}
		>
			{busy === "pay" ? (
				<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
			) : (
				<CreditCard className="mr-1.5 h-3.5 w-3.5" />
			)}
			{label}
		</Button>
	);

	const close = onClose && (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="h-8 text-xs"
			disabled={!!busy}
			onClick={onClose}
		>
			{t("picker.close")}
		</Button>
	);

	let hint: string;
	let actions: React.ReactNode;
	switch (change.kind) {
		case "subscribe":
			hint =
				state.status === "trial"
					? t("picker.trialHint", {
							amount: change.amount,
							cycle: next.cycle,
							date: date(change.startsAt),
						})
					: t("picker.expiredHint", { amount: change.amount });
			actions = pay(t("picker.subscribe", { amount: change.amount }));
			break;
		case "upgrade":
			hint = t("picker.upgradeHint", {
				amount: change.amount,
				perMonth: change.perMonth,
				days: change.days,
				date: date(change.until),
				price,
				cycle: next.cycle,
			});
			actions = (
				<>
					{close}
					{pay(t("picker.upgrade", { amount: change.amount }))}
				</>
			);
			break;
		case "scheduled":
			hint = t("picker.scheduleHint", {
				date: date(change.from),
				price,
				cycle: next.cycle,
			});
			actions = (
				<>
					{close}
					<Button
						type="button"
						size="sm"
						className="h-8 text-xs"
						disabled={!!busy}
						onClick={() =>
							run(
								"save",
								() => scheduleChange(next),
								t("picker.scheduled", { date: date(change.from) }),
							)
						}
					>
						{busy === "save" ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<CalendarClock className="mr-1.5 h-3.5 w-3.5" />
						)}
						{t("picker.schedule", { date: date(change.from) })}
					</Button>
				</>
			);
			break;
		default:
			hint = t("picker.currentHint");
			actions = close;
	}

	// During the free month, a different plan can be tried without paying.
	const tryFree = state.status === "trial" && !samePlan(state, next);

	return (
		<div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
			<p className="text-xs leading-relaxed">{hint}</p>
			{change.kind !== "current" && limit < usedStorageGb && (
				<p className="flex items-start gap-1.5 text-xs text-warning">
					<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					{t("picker.storageWarning", { used: usedStorageGb, limit })}
				</p>
			)}
			<div className="flex flex-wrap items-center justify-end gap-2">
				{actions}
			</div>
			{tryFree && (
				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
					<p className="text-[11px] text-muted-foreground">
						{t("picker.tryFreeHint")}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 px-2.5 text-[11px]"
						disabled={!!busy}
						onClick={() =>
							run("save", () => choosePlan(next), t("picker.saved"))
						}
					>
						{busy === "save" && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("picker.tryFree", { date: date(state.trialEndsAt) })}
					</Button>
				</div>
			)}
		</div>
	);
}
