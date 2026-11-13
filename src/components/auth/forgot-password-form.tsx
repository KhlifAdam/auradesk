"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { AUTH_PATHS, type AuthAudience } from "@/lib/auth/client-intent";
import { AuthHeading } from "./auth-heading";
import { type ForgotPasswordValues, forgotPasswordSchema } from "./schemas";
import { useAuthError } from "./use-auth-error";

/** Sends the reset code; `audience` keeps the client or studio side throughout. */
export function ForgotPasswordForm({
	audience = "photographer",
}: {
	audience?: AuthAudience;
}) {
	const paths = AUTH_PATHS[audience];
	const t = useTranslations("Auth");
	const router = useRouter();
	const authError = useAuthError();
	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" },
	});
	const { isSubmitting } = form.formState;

	async function onSubmit({ email }: ForgotPasswordValues) {
		try {
			const { error } = await authClient.emailOtp.requestPasswordReset({
				email,
			});
			if (error) return void toast.error(authError.message(error));
			toast.success(t("forgot.sent"));
			router.push(`${paths.resetPassword}?email=${encodeURIComponent(email)}`);
		} catch {
			toast.error(authError.network);
		}
	}

	return (
		<div className="flex flex-col space-y-6">
			<AuthHeading
				title={t("forgot.title")}
				description={t("forgot.description")}
			/>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("forgot.email")}</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder={t("shared.emailPlaceholder")}
										autoComplete="email"
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
						{t("forgot.submit")}
					</Button>
				</form>
			</Form>

			<Link
				href={paths.login}
				className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("forgot.back")}
			</Link>
		</div>
	);
}
