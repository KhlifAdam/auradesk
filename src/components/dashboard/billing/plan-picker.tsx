"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { SegmentedControl } from "@/components/dashboard/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { choosePlan } from "@/services/billing/actions";
import {
	BILLING_CYCLES,
	PLAN_IDS,
	POPULAR_PLAN,
	pricePerMonth,
	pricePerPeriod,
} from "@/services/billing/plans";
import { choosePlanSchema } from "@/services/billing/schemas";

type PlanValues = z.infer<typeof choosePlanSchema>;

/** Choose the plan and billing to pay for once the free month ends. */
export function PlanPicker({ defaultValues }: { defaultValues: PlanValues }) {
	const t = useTranslations("Billing");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<PlanValues>({
		resolver: zodResolver(choosePlanSchema),
		defaultValues,
	});
	const { isDirty, isSubmitting } = form.formState;
	const cycle = form.watch("cycle");

	async function onSubmit(values: PlanValues) {
		const result = await choosePlan(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		form.reset(values);
		toast.success(t("picker.saved"));
		router.refresh();
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="text-sm font-semibold">{t("picker.title")}</h2>
					<FormField
						control={form.control}
						name="cycle"
						render={({ field }) => (
							<SegmentedControl
								value={field.value}
								onChange={field.onChange}
								options={BILLING_CYCLES.map((id) => ({
									value: id,
									label: t(`cycles.${id}`),
								}))}
							/>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="plan"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="grid gap-2 sm:grid-cols-3">
									{PLAN_IDS.map((plan) => {
										const selected = field.value === plan;
										return (
											<button
												key={plan}
												type="button"
												aria-pressed={selected}
												onClick={() => field.onChange(plan)}
												className={cn(
													"relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-all duration-200",
													selected
														? "border-primary bg-primary/5 ring-1 ring-primary"
														: "border-border hover:border-primary/50",
												)}
											>
												<span className="flex items-center justify-between gap-2 text-xs font-semibold">
													{t(`plans.${plan}.name`)}
													{selected ? (
														<Check className="h-3.5 w-3.5 text-primary" />
													) : (
														plan === POPULAR_PLAN && (
															<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
																{t("picker.popular")}
															</span>
														)
													)}
												</span>
												<span className="text-lg font-bold">
													{t("picker.perMonth", {
														amount: pricePerMonth(plan, cycle),
													})}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{t(`plans.${plan}.summary`)}
												</span>
											</button>
										);
									})}
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="text-xs text-muted-foreground">
						{t(`picker.billed.${cycle}`, {
							amount: pricePerPeriod(form.watch("plan"), cycle),
						})}
					</p>
					<Button
						type="submit"
						size="sm"
						className="h-8 text-xs"
						disabled={!isDirty || isSubmitting}
					>
						{isSubmitting && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("picker.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
