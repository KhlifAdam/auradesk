"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type CodeValues, codeSchema } from "@/components/auth/schemas";
import { useAuthError } from "@/components/auth/use-auth-error";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCountdown } from "@/hooks/use-countdown";
import { IdentityGate } from "./identity-check";

type AuthResult = { error: { code?: string } | null };

const RESEND_SECONDS = 60;

/** Failures about the code itself; any other one is about the contact. */
const CODE_ERRORS = new Set([
	"INVALID_OTP",
	"OTP_EXPIRED",
	"OTP_NOT_FOUND",
	"TOO_MANY_ATTEMPTS",
]);

interface ContactChangeProps {
	title: string;
	/** The contact now on the account, formatted; null when there is none. */
	current: string | null;
	verified: boolean;
	/** Turns what was typed into what the server stores; null when invalid. */
	parse: (raw: string) => string | null;
	/** `Validation` message shown when `parse` rejects the input. */
	invalidKey: "invalidEmail" | "invalidPhone";
	inputType: "email" | "tel";
	placeholder: string;
	/** Sends the code to the new contact. */
	request: (value: string) => Promise<AuthResult>;
	/** Checks the code and attaches the contact to the account. */
	confirm: (value: string, code: string) => Promise<AuthResult>;
	/** Replaces the current contact line under the title. */
	summary?: ReactNode;
	/** Ask who is changing it (see `IdentityGate`) before the new contact. */
	identity?: { hasPassword: boolean };
	/** Replaces "Add" / "Change" on the button. */
	actionLabel?: string;
	/** Replaces "Saved" once the code is confirmed. */
	successMessage?: string;
	children?: ReactNode;
}

/**
 * Adds or changes one contact of the signed-in account: type it, receive a
 * code there, enter the code. The same steps for an email and a phone number.
 */
export function ContactChange({
	title,
	current,
	verified,
	parse,
	invalidKey,
	inputType,
	placeholder,
	request,
	confirm,
	summary,
	identity,
	actionLabel,
	successMessage,
	children,
}: ContactChangeProps) {
	const t = useTranslations("Portal.account");
	const router = useRouter();
	const authError = useAuthError();
	const [editing, setEditing] = useState(false);
	// What the code was sent to; null while still asking for the contact.
	const [pending, setPending] = useState<string | null>(null);
	const [identified, setIdentified] = useState(!identity);
	const resendIn = useCountdown();
	// The code is used up even when the contact is refused (e.g. already taken),
	// so a retry would say "no code"; it repeats the real reason instead.
	const refusal = useRef<{ error: { code?: string }; to: string } | null>(null);

	const valueSchema = useMemo(
		() =>
			z.object({
				value: z
					.string()
					.trim()
					.refine((raw) => parse(raw) !== null, invalidKey),
			}),
		[parse, invalidKey],
	);
	const valueForm = useForm<{ value: string }>({
		resolver: zodResolver(valueSchema),
		defaultValues: { value: "" },
	});
	const codeForm = useForm<CodeValues>({
		resolver: zodResolver(codeSchema),
		defaultValues: { code: "" },
	});

	function close() {
		setEditing(false);
		setPending(null);
		setIdentified(!identity);
		valueForm.reset();
		codeForm.reset();
	}

	async function onRequest({ raw }: { raw: string }) {
		const value = parse(raw);
		if (!value) return;
		const { error } = await request(value);
		if (error) return void toast.error(authError.message(error));
		refusal.current = null;
		setPending(value);
		resendIn.start(RESEND_SECONDS);
		toast.success(t("codeSent"));
	}

	async function onResend() {
		if (!pending || resendIn.seconds > 0) return;
		resendIn.start(RESEND_SECONDS);
		const { error } = await request(pending);
		if (error) return void toast.error(authError.message(error));
		refusal.current = null;
		codeForm.reset();
		toast.success(t("codeSent"));
	}

	async function onConfirm({ code }: CodeValues) {
		if (!pending) return;
		const { error } = await confirm(pending, code);
		if (error) {
			const kept = refusal.current;
			if (error.code && !CODE_ERRORS.has(error.code))
				refusal.current = { error, to: pending };
			else if (error.code === "OTP_NOT_FOUND" && kept?.to === pending)
				return void toast.error(authError.message(kept.error));
			return void toast.error(authError.message(error));
		}
		toast.success(successMessage ?? t("saved"));
		close();
		router.refresh();
	}

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="min-w-0">
					<h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
					{summary ?? (
						<p className="flex items-center gap-2 text-sm font-medium">
							{current ?? (
								<span className="text-muted-foreground">{t("none")}</span>
							)}
							{current && verified && (
								<BadgeCheck
									className="h-4 w-4 text-success"
									aria-label={t("verified")}
								/>
							)}
						</p>
					)}
				</div>
				{!editing && (
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						onClick={() => setEditing(true)}
					>
						{actionLabel ?? (current ? t("change") : t("add"))}
					</Button>
				)}
			</div>
			{children}
			{editing && identity && !identified && (
				<IdentityGate
					hasPassword={identity.hasPassword}
					onVerified={() => setIdentified(true)}
					onCancel={close}
				/>
			)}
			{editing &&
				identified &&
				(pending ? (
					<Form {...codeForm}>
						<form
							onSubmit={codeForm.handleSubmit(onConfirm)}
							className="flex flex-wrap items-start gap-2"
						>
							<p className="w-full text-xs text-muted-foreground">
								{t("codeSentTo", { to: pending })}
							</p>
							<FormField
								control={codeForm.control}
								name="code"
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormControl>
											<Input
												inputMode="numeric"
												autoComplete="one-time-code"
												autoFocus
												maxLength={6}
												placeholder={t("codePlaceholder")}
												aria-label={t("codePlaceholder")}
												className="h-8 w-56 text-sm tracking-widest"
												{...field}
												onChange={(event) =>
													field.onChange(event.target.value.replace(/\D/g, ""))
												}
											/>
										</FormControl>
										<FormMessage className="text-xs" />
									</FormItem>
								)}
							/>
							<Submit pending={codeForm.formState.isSubmitting}>
								{t("confirm")}
							</Submit>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 text-xs"
								onClick={() => setPending(null)}
							>
								{t("backStep")}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 text-xs"
								disabled={resendIn.seconds > 0}
								onClick={onResend}
							>
								{resendIn.seconds > 0
									? t("resendIn", { seconds: resendIn.seconds })
									: t("resend")}
							</Button>
						</form>
					</Form>
				) : (
					<Form {...valueForm}>
						<form
							onSubmit={valueForm.handleSubmit(({ value }) =>
								onRequest({ raw: value }),
							)}
							className="flex flex-wrap items-start gap-2"
						>
							<FormField
								control={valueForm.control}
								name="value"
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormControl>
											<Input
												type={inputType}
												autoFocus
												placeholder={placeholder}
												aria-label={placeholder}
												className="h-8 w-64 text-sm"
												{...field}
											/>
										</FormControl>
										<FormMessage className="text-xs" />
									</FormItem>
								)}
							/>
							<Submit pending={valueForm.formState.isSubmitting}>
								{t("sendCode")}
							</Submit>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 text-xs"
								onClick={close}
							>
								{t("cancel")}
							</Button>
						</form>
					</Form>
				))}
		</section>
	);
}

function Submit({
	pending,
	children,
}: {
	pending: boolean;
	children: ReactNode;
}) {
	return (
		<Button type="submit" size="sm" className="h-8 text-xs" disabled={pending}>
			{pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
			{children}
		</Button>
	);
}
