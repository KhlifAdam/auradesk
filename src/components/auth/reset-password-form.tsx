"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AUTH_PATHS, type AuthAudience } from "@/lib/auth/client-intent";
import { AuthHeading } from "./auth-heading";
import { PasswordInput } from "./password-input";
import {
	OTP_LENGTH,
	type ResetPasswordValues,
	resetPasswordSchema,
} from "./schemas";
import { useAuthError } from "./use-auth-error";

const OTP_SLOTS = Array.from({ length: OTP_LENGTH }, (_, i) => `slot-${i}`);

export function ResetPasswordForm({
	email,
	audience = "photographer",
}: {
	email: string;
	audience?: AuthAudience;
}) {
	const paths = AUTH_PATHS[audience];
	const t = useTranslations("Auth");
	const router = useRouter();
	const authError = useAuthError();
	const [isResending, setIsResending] = useState(false);
	const [showPasswords, setShowPasswords] = useState(false);
	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { otp: "", password: "", confirmPassword: "" },
	});
	const { isSubmitting } = form.formState;

	async function onSubmit({ otp, password }: ResetPasswordValues) {
		try {
			const { error } = await authClient.emailOtp.resetPassword({
				email,
				otp,
				password,
			});
			if (error) return void toast.error(authError.message(error));
			toast.success(t("reset.success"));
			router.push(paths.login);
		} catch {
			toast.error(authError.network);
		}
	}

	async function resend() {
		setIsResending(true);
		try {
			const { error } = await authClient.emailOtp.requestPasswordReset({
				email,
			});
			if (error) return void toast.error(authError.message(error));
			form.resetField("otp");
			toast.success(t("reset.resent"));
		} catch {
			toast.error(authError.network);
		} finally {
			setIsResending(false);
		}
	}

	return (
		<div className="flex flex-col space-y-6">
			<AuthHeading
				title={t("reset.title")}
				description={t.rich("reset.description", {
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
						name="otp"
						render={({ field }) => (
							<FormItem className="flex flex-col items-center">
								<FormLabel>{t("reset.otp")}</FormLabel>
								<FormControl>
									<InputOTP
										maxLength={OTP_LENGTH}
										readOnly={isSubmitting}
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
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("reset.newPassword")}</FormLabel>
								<FormControl>
									<PasswordInput
										visible={showPasswords}
										onToggleVisible={() => setShowPasswords((v) => !v)}
										placeholder="••••••••"
										autoComplete="new-password"
										readOnly={isSubmitting}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("reset.confirmPassword")}</FormLabel>
								<FormControl>
									<PasswordInput
										visible={showPasswords}
										placeholder="••••••••"
										autoComplete="new-password"
										readOnly={isSubmitting}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("reset.submit")}
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
					{isResending ? t("reset.resending") : t("reset.resend")}
				</button>
				<Link
					href={paths.login}
					className="flex items-center gap-2 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("reset.back")}
				</Link>
			</div>
		</div>
	);
}
