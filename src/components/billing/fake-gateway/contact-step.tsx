"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ChevronDown,
	CreditCard,
	Landmark,
	Mail,
	ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type CardMethod,
	type ContactValues,
	cleanName,
	contactSchema,
	typePhone,
} from "@/lib/payments/gateway-forms";
import { cn } from "@/lib/utils";
import { FieldError, gw, TunisianFlag } from "./checkout-ui";

const METHODS = [
	["bankCard", CreditCard],
	["eDinar", Landmark],
] as const;

const formatPhone = (digits: string) =>
	[digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)]
		.filter(Boolean)
		.join(" ");

/**
 * Contact details, then the card types as an accordion: opening one checks
 * the details above and unfolds its card form in place. Prefilled from the
 * account, as the gateway does with what the merchant sends it.
 */
export function ContactStep({
	defaults,
	disabled,
	panel,
}: {
	defaults: ContactValues;
	disabled: boolean;
	panel: (
		method: CardMethod,
		open: boolean,
		checkContact: () => Promise<boolean>,
	) => ReactNode;
}) {
	const t = useTranslations("FakeGateway");
	const [open, setOpen] = useState<CardMethod | null>(null);
	const form = useForm<ContactValues>({
		resolver: zodResolver(contactSchema),
		mode: "onTouched",
		defaultValues: defaults,
	});
	const { errors } = form.formState;
	const border = (field: keyof ContactValues) =>
		errors[field] ? gw.invalid : gw.border;
	const checkContact = () => form.trigger();

	async function toggle(method: CardMethod) {
		if (open === method) return setOpen(null);
		if (await checkContact()) setOpen(method);
	}

	return (
		<div className="flex w-full max-w-sm flex-1 flex-col gap-5">
			<div>
				<p className={`h-10 ${gw.title}`}>{t("paymentMethod")}</p>
				<span className="flex w-24 flex-col gap-y-0.5 rounded-md border-2 border-[#3d5170] px-2.5 py-1.5 font-semibold">
					<CreditCard className="h-4 w-4" />
					<span className="text-[13px] opacity-70">{t("card")}</span>
				</span>
			</div>

			<div>
				<p className={`pb-4 ${gw.title}`}>{t("contact")}</p>
				<div className="grid grid-cols-2">
					{(["firstName", "lastName"] as const).map((name) => (
						<div key={name} className="relative">
							<Controller
								control={form.control}
								name={name}
								render={({ field }) => (
									<input
										name={field.name}
										ref={field.ref}
										onBlur={field.onBlur}
										value={field.value}
										onChange={(event) =>
											field.onChange(cleanName(event.target.value))
										}
										placeholder={t(name)}
										autoComplete={
											name === "firstName" ? "given-name" : "family-name"
										}
										disabled={disabled}
										aria-invalid={!!errors[name]}
										className={cn(
											gw.input,
											"border-t",
											name === "firstName"
												? "rounded-tl-md border-l"
												: "rounded-tr-md border-x",
											border(name),
										)}
									/>
								)}
							/>
							<FieldError code={errors[name]?.message} />
						</div>
					))}
				</div>
				<div className="relative flex">
					<span className="flex h-9 items-center gap-1.5 border border-r-0 border-[#e5e7eb] bg-white px-3 text-sm">
						<TunisianFlag />
						+216
					</span>
					<Controller
						control={form.control}
						name="phone"
						render={({ field }) => (
							<input
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								value={formatPhone(field.value)}
								onChange={(event) =>
									field.onChange(typePhone(event.target.value, field.value))
								}
								type="tel"
								inputMode="numeric"
								autoComplete="tel-national"
								placeholder={t("phone")}
								disabled={disabled}
								aria-invalid={!!errors.phone}
								className={cn(gw.input, "border", border("phone"))}
							/>
						)}
					/>
					<FieldError code={errors.phone?.message} />
				</div>
				<div className="relative">
					<input
						{...form.register("email", {
							setValueAs: (value: string) => value.replace(/\s/g, ""),
						})}
						type="email"
						placeholder={t("email")}
						autoComplete="email"
						disabled={disabled}
						aria-invalid={!!errors.email}
						className={cn(
							gw.input,
							"rounded-b-md border-x border-b pl-12",
							border("email"),
						)}
					/>
					<Mail className="pointer-events-none absolute top-2 left-4 z-10 h-5 w-5" />
					<FieldError code={errors.email?.message} />
				</div>
			</div>

			<div className="flex flex-col gap-4">
				{METHODS.map(([method, Icon]) => {
					const isOpen = open === method;
					return (
						<div
							key={method}
							className="overflow-hidden rounded-md border border-gray-400/10 bg-white"
						>
							<button
								type="button"
								disabled={disabled}
								onClick={() => toggle(method)}
								aria-expanded={isOpen}
								aria-controls={`panel-${method}`}
								className={cn(
									gw.method,
									"rounded-none border-0",
									isOpen && "bg-[#c2f915] text-neutral-900 opacity-100",
								)}
							>
								<span className="flex items-center gap-2">
									<Icon className="h-5 w-5" />
									{t(`methods.${method}`)}
								</span>
								<ChevronDown
									className={cn(
										"h-4 w-4 transition-transform duration-300",
										isOpen && "rotate-180",
									)}
								/>
							</button>
							<div
								id={`panel-${method}`}
								inert={!isOpen}
								className={cn(
									"grid transition-[grid-template-rows] duration-300 ease-in-out",
									isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
								)}
							>
								<div className="min-h-0">
									{panel(method, isOpen, checkContact)}
								</div>
							</div>
						</div>
					);
				})}
				<div className={`mt-4 flex gap-3 ${gw.note}`}>
					<ShieldCheck className="h-8 w-8 shrink-0 fill-[#c2f915]/50 text-[#03003a]/50" />
					<p>{t("secureNote")}</p>
				</div>
			</div>
		</div>
	);
}
