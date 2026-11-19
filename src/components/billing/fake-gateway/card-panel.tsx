"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Landmark, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	ACCEPTED_BRANDS,
	detectCardBrand,
	formatCardNumber,
} from "@/lib/payments/card-brands";
import {
	type CardMethod,
	type CardValues,
	cardSchema,
	cleanHolder,
	cvvLengthFor,
	DECLINED_TEST_CARD,
	digitsOnly,
	formatExpiry,
	isValidCardNumber,
	typeCardNumber,
	typeExpiry,
} from "@/lib/payments/gateway-forms";
import { cn } from "@/lib/utils";
import { completeFakePayment } from "@/services/billing/fake-gateway-actions";
import { CardBrandIcon } from "./card-brand-icon";
import { FieldError, gw } from "./checkout-ui";

/** How long the bank takes to answer. */
const PROCESSING_MS = 1200;

/**
 * The card form, opened under the card type the payer picked. Checked in
 * the browser; the card never leaves it. One card number is always declined.
 */
export function CardPanel({
	method,
	open,
	paymentRef,
	amount,
	expired,
	checkContact,
}: {
	method: CardMethod;
	open: boolean;
	paymentRef: string;
	amount: string;
	expired: boolean;
	/** Validates the contact details above; false keeps the payment back. */
	checkContact: () => Promise<boolean>;
}) {
	const t = useTranslations("FakeGateway");
	const errorMessage = useErrorMessage();
	const [declined, setDeclined] = useState(false);
	const [processing, setProcessing] = useState(false);
	const form = useForm<CardValues>({
		resolver: zodResolver(cardSchema(method)),
		mode: "onTouched",
		defaultValues: { number: "", expiry: "", cvv: "", holder: "" },
	});
	const { errors } = form.formState;
	const number = form.watch("number");
	const brand = detectCardBrand(number);
	const cvvLength = cvvLengthFor(number);
	const disabled = processing || expired;
	const border = (field: keyof CardValues) =>
		errors[field] ? gw.invalid : gw.border;

	useEffect(() => {
		if (open) form.setFocus("number");
	}, [open, form]);

	async function pay(values: CardValues) {
		if (!(await checkContact())) return;
		setDeclined(false);
		setProcessing(true);
		await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));
		if (values.number === DECLINED_TEST_CARD) {
			setProcessing(false);
			return setDeclined(true);
		}
		const result = await completeFakePayment({ paymentRef });
		if (!result.ok) {
			setProcessing(false);
			return void toast.error(errorMessage(result.error));
		}
		window.location.assign(result.data.redirectTo);
	}

	return (
		<form
			onSubmit={form.handleSubmit(pay)}
			noValidate
			className="flex flex-col gap-4 p-4"
		>
			<div className="flex items-center justify-between">
				<p className={gw.label}>{t("cardDetails")}</p>
				{method === "eDinar" ? (
					<Landmark className="h-5 w-5 text-[#03003a]" aria-hidden="true" />
				) : (
					<div className="flex gap-1">
						{ACCEPTED_BRANDS.map((id) => (
							<CardBrandIcon
								key={id}
								brand={id}
								className={cn(
									"transition-opacity duration-200",
									brand && brand.id !== id && "opacity-30",
								)}
							/>
						))}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2">
				<div className="relative col-span-2">
					<Controller
						control={form.control}
						name="number"
						render={({ field }) => (
							<input
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								value={formatCardNumber(field.value)}
								onChange={(event) => {
									const next = typeCardNumber(
										event.target.value,
										field.value,
										method,
									);
									field.onChange(next);
									const cvv = form.getValues("cvv");
									if (cvv.length > cvvLengthFor(next))
										form.setValue("cvv", cvv.slice(0, cvvLengthFor(next)));
									if (next !== field.value && isValidCardNumber(next, method))
										form.setFocus("expiry");
								}}
								inputMode="numeric"
								autoComplete="cc-number"
								placeholder={t("fields.number")}
								aria-label={t("fields.number")}
								disabled={disabled}
								aria-invalid={!!errors.number}
								className={cn(
									gw.input,
									"rounded-t-md border-x border-t pr-14 tracking-wide",
									border("number"),
								)}
							/>
						)}
					/>
					<span className="pointer-events-none absolute top-2 right-3 z-10">
						{brand ? (
							<CardBrandIcon brand={brand.id} />
						) : (
							<CreditCard className="h-5 w-8 text-[#9ca3af]" />
						)}
					</span>
					<FieldError code={errors.number?.message} className="right-13" />
				</div>

				<div className="relative">
					<Controller
						control={form.control}
						name="expiry"
						render={({ field }) => (
							<input
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								value={formatExpiry(field.value)}
								onChange={(event) => {
									const next = typeExpiry(event.target.value, field.value);
									field.onChange(next);
									if (next.length === 4 && next !== field.value)
										form.setFocus("cvv");
								}}
								inputMode="numeric"
								autoComplete="cc-exp"
								placeholder={t("fields.expiry")}
								aria-label={t("fields.expiry")}
								disabled={disabled}
								aria-invalid={!!errors.expiry}
								className={cn(gw.input, "border-x border-t", border("expiry"))}
							/>
						)}
					/>
					<FieldError code={errors.expiry?.message} />
				</div>

				<div className="relative">
					<Controller
						control={form.control}
						name="cvv"
						render={({ field }) => (
							<input
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								value={field.value}
								onChange={(event) => {
									const next = digitsOnly(event.target.value).slice(
										0,
										cvvLength,
									);
									field.onChange(next);
									if (next.length === cvvLength && next !== field.value)
										form.setFocus("holder");
								}}
								type="password"
								inputMode="numeric"
								autoComplete="cc-csc"
								placeholder={t("fields.cvv")}
								aria-label={t("fields.cvv")}
								disabled={disabled}
								aria-invalid={!!errors.cvv}
								className={cn(gw.input, "border-t border-r", border("cvv"))}
							/>
						)}
					/>
					<FieldError code={errors.cvv?.message} />
				</div>

				<div className="relative col-span-2">
					<Controller
						control={form.control}
						name="holder"
						render={({ field }) => (
							<input
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								value={field.value}
								onChange={(event) =>
									field.onChange(cleanHolder(event.target.value))
								}
								autoComplete="cc-name"
								placeholder={t("fields.holder")}
								aria-label={t("fields.holder")}
								disabled={disabled}
								aria-invalid={!!errors.holder}
								className={cn(
									gw.input,
									"rounded-b-md border",
									border("holder"),
								)}
							/>
						)}
					/>
					<FieldError code={errors.holder?.message} />
				</div>
			</div>

			{declined && (
				<div role="alert" className={gw.alert}>
					<p className="font-semibold">{t("declinedTitle")}</p>
					<p className="text-xs">{t("declined")}</p>
				</div>
			)}

			<button
				type="submit"
				disabled={disabled}
				className={cn(gw.pay, "w-full")}
			>
				{processing ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						{t("processing")}
					</>
				) : (
					<>
						<Lock className="h-4 w-4" />
						{t("pay", { amount })}
					</>
				)}
			</button>
		</form>
	);
}
