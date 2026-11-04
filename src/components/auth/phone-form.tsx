"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { AUTH_PATHS } from "@/lib/auth/client-intent";
import { formatPhone, toE164 } from "@/lib/phone";
import type { CodeChannel } from "@/lib/whatsapp/code-channel";
import { setClientIntent } from "@/services/auth/intent-actions";
import { AudienceBadge } from "./audience-badge";
import { AuthBackLink } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import {
	type CodeValues,
	codeSchema,
	type PhoneValues,
	phoneSchema,
} from "./schemas";
import { useAuthError } from "./use-auth-error";

const RESEND_SECONDS = 60;
const paths = AUTH_PATHS.client;

/**
 * Sign in or sign up with a phone number: a code is texted, and entering it
 * opens the account (a new number creates one). No password, no email.
 */
export function PhoneForm({
	defaultPhone = "",
	channel = "sms",
}: {
	defaultPhone?: string;
	/** How codes go out right now; WhatsApp falls back to SMS per number. */
	channel?: CodeChannel;
}) {
	const t = useTranslations("Auth.phone");
	const onWhatsapp = channel === "whatsapp";
	const authError = useAuthError();
	// The number the code was sent to; null while still asking for it.
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);

	const phoneForm = useForm<PhoneValues>({
		resolver: zodResolver(phoneSchema),
		defaultValues: { phone: defaultPhone },
	});
	const codeForm = useForm<CodeValues>({
		resolver: zodResolver(codeSchema),
		defaultValues: { code: "" },
	});

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	async function sendCode({ phone }: PhoneValues) {
		const number = toE164(phone);
		if (!number) return;
		try {
			// The intent cookie gives a new account the client role.
			await setClientIntent();
			const { error } = await authClient.phoneNumber.sendOtp({
				phoneNumber: number,
			});
			if (error) return void toast.error(authError.message(error));
			setSentTo(number);
			setCooldown(RESEND_SECONDS);
			codeForm.reset({ code: "" });
			toast.success(onWhatsapp ? t("whatsapp.sent") : t("sent"));
		} catch {
			toast.error(authError.network);
		}
	}

	async function verify({ code }: CodeValues) {
		if (!sentTo) return;
		try {
			await setClientIntent();
			const { error } = await authClient.phoneNumber.verify({
				phoneNumber: sentTo,
				code,
			});
			if (error) return void toast.error(authError.message(error));
			toast.success(t("success"));
			window.location.assign(paths.home);
		} catch {
			toast.error(authError.network);
		}
	}

	const sending = phoneForm.formState.isSubmitting;
	const verifying = codeForm.formState.isSubmitting;

	return (
		<div className="flex flex-col space-y-6">
			<AuthBackLink audience="client" />
			<AuthHeading
				title={t("title")}
				description={
					sentTo
						? t(onWhatsapp ? "whatsapp.codeDescription" : "codeDescription", {
								phone: formatPhone(sentTo),
							})
						: t(onWhatsapp ? "whatsapp.description" : "description")
				}
				badge={<AudienceBadge audience="client" />}
			/>
			<div className="grid gap-6">
				{sentTo ? (
					<Form {...codeForm}>
						<form
							onSubmit={codeForm.handleSubmit(verify)}
							className="grid gap-4"
						>
							<FormField
								control={codeForm.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("code")}</FormLabel>
										<FormControl>
											<Input
												inputMode="numeric"
												autoComplete="one-time-code"
												autoFocus
												maxLength={6}
												placeholder="123456"
												className="tracking-[0.4em]"
												readOnly={verifying}
												{...field}
												onChange={(event) =>
													field.onChange(event.target.value.replace(/\D/g, ""))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button disabled={verifying} className="mt-2">
								{verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{t("verify")}
							</Button>
							<div className="flex items-center justify-between text-sm">
								<button
									type="button"
									className="text-muted-foreground underline underline-offset-4 hover:text-primary"
									onClick={() => setSentTo(null)}
								>
									{t("changeNumber")}
								</button>
								<button
									type="button"
									disabled={cooldown > 0 || sending}
									className="text-primary underline underline-offset-4 disabled:text-muted-foreground disabled:no-underline"
									onClick={() => sendCode({ phone: sentTo })}
								>
									{cooldown > 0
										? t("resendIn", { seconds: cooldown })
										: t("resend")}
								</button>
							</div>
						</form>
					</Form>
				) : (
					<Form {...phoneForm}>
						<form
							onSubmit={phoneForm.handleSubmit(sendCode)}
							className="grid gap-4"
						>
							<FormField
								control={phoneForm.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("phone")}</FormLabel>
										<FormControl>
											<Input
												type="tel"
												autoComplete="tel"
												autoFocus
												placeholder="20 123 456"
												readOnly={sending}
												{...field}
											/>
										</FormControl>
										<FormDescription>{t("phoneHint")}</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button disabled={sending} className="mt-2">
								{sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{t("send")}
							</Button>
						</form>
					</Form>
				)}
			</div>
			<p className="px-8 text-center text-sm text-muted-foreground">
				{t("useEmail")}{" "}
				<Link
					href={paths.login}
					className="underline underline-offset-4 hover:text-primary"
				>
					{t("emailLink")}
				</Link>
			</p>
		</div>
	);
}
