"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth/client";
import {
	AUDIENCE_ROLES,
	AUTH_PATHS,
	type AuthAudience,
} from "@/lib/auth/client-intent";
import { AuthHeading } from "./auth-heading";
import { type CodeValues, codeSchema, OTP_LENGTH } from "./schemas";
import { useAuthError } from "./use-auth-error";

const OTP_SLOTS = Array.from({ length: OTP_LENGTH }, (_, i) => `slot-${i}`);

/** Last step of an email sign-up: the code proves the address and signs in. */
export function VerifyEmailForm({
	email,
	audience,
}: {
	email: string;
	audience: AuthAudience;
}) {
	const t = useTranslations("Auth");
	const authError = useAuthError();
	const paths = AUTH_PATHS[audience];
	const [isResending, setIsResending] = useState(false);
	const form = useForm<CodeValues>({
		resolver: zodResolver(codeSchema),
		defaultValues: { code: "" },
	});
	const { isSubmitting } = form.formState;

	async function onSubmit({ code }: CodeValues) {
		try {
			const { data, error } = await authClient.emailOtp.verifyEmail({
				email,
				otp: code,
			});
			if (error) return void toast.error(authError.message(error));
			toast.success(t("verify.success"));
			// Verified and signed in; an account of the other side goes to its own page.
			const role = data?.user?.role ?? "";
			const home = AUDIENCE_ROLES[audience].includes(role)
				? paths.home
				: AUTH_PATHS[audience === "client" ? "photographer" : "client"].home;
			window.location.assign(home);
		} catch {
			toast.error(authError.network);
		}
	}

	async function resend() {
		setIsResending(true);
		try {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "email-verification",
			});
			if (error) return void toast.error(authError.message(error));
			form.resetField("code");
			toast.success(t("verify.resent"));
		} catch {
			toast.error(authError.network);
		} finally {
			setIsResending(false);
		}
	}

	return (
		<div className="flex flex-col space-y-6">
			<AuthHeading
				title={t("verify.title")}
				description={t.rich("verify.description", {
					email,
					strong: (chunks) => (
						<span className="font-medium text-foreground">{chunks}</span>
					),
				})}
			/>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
					<FormField
						control={form.control}
						name="code"
						render={({ field }) => (
							<FormItem className="flex flex-col items-center">
								<FormLabel>{t("verify.code")}</FormLabel>
								<FormControl>
									<InputOTP
										maxLength={OTP_LENGTH}
										readOnly={isSubmitting}
										autoFocus
										{...field}
									>
										<InputOTPGroup>
											{OTP_SLOTS.map((slot, index) => (
												<InputOTPSlot key={slot} index={index} />
											))}
										</InputOTPGroup>
									</InputOTP>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("verify.submit")}
					</Button>
				</form>
			</Form>

			<div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
				<button
					type="button"
					onClick={resend}
					disabled={isResending || isSubmitting}
					className="hover:text-primary disabled:opacity-50"
				>
					{isResending ? t("verify.resending") : t("verify.resend")}
				</button>
				<Link
					href={paths.login}
					className="flex items-center gap-2 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("verify.back")}
				</Link>
			</div>
		</div>
	);
}
