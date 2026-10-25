"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import {
	AUDIENCE_ROLES,
	AUTH_PATHS,
	verifyEmailPath,
} from "@/lib/auth/client-intent";
import { ROLES } from "@/lib/auth/roles";
import { AudienceBadge } from "./audience-badge";
import { AuthBackLink } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { PasswordInput } from "./password-input";
import { type LoginValues, loginSchema } from "./schemas";
import { SocialLogin, type SocialLoginProps } from "./social-login";
import { useAuthError } from "./use-auth-error";

type LoginFormProps = Pick<
	SocialLoginProps,
	"audience" | "providers" | "oauthError"
>;

export function LoginForm({ audience, providers, oauthError }: LoginFormProps) {
	const t = useTranslations("Auth");
	const isClient = audience === "client";
	const paths = AUTH_PATHS[audience];
	const authError = useAuthError();
	const [showPassword, setShowPassword] = useState(false);
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: LoginValues) {
		try {
			const { data, error } = await authClient.signIn.email(values);
			// Unproven address: the server has just sent a fresh code for it.
			if (error?.code === "EMAIL_NOT_VERIFIED") {
				toast.info(t("verify.required"));
				return window.location.assign(verifyEmailPath(values.email, audience));
			}
			if (error) return void toast.error(authError.message(error));
			// Each side only takes its own accounts: sign back out and point the
			// person to the right page.
			if (!AUDIENCE_ROLES[audience].includes(data?.user.role ?? "")) {
				await authClient.signOut();
				return void toast.error(
					t(
						data?.user.role === ROLES.admin
							? "login.wrongAudience.admin"
							: `login.wrongAudience.${audience}`,
					),
				);
			}
			toast.success(t("login.success"));
			window.location.assign(paths.home);
		} catch {
			toast.error(authError.network);
		}
	}

	return (
		<div className="flex flex-col space-y-6">
			<AuthBackLink audience={audience} />
			<AuthHeading
				title={t(isClient ? "client.login.title" : "login.title")}
				description={t(
					isClient ? "client.login.description" : "login.description",
				)}
				badge={<AudienceBadge audience={audience} />}
				highlights={t(`highlights.${audience}`)}
			/>

			<div className="grid gap-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("login.email")}</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder={t("shared.emailPlaceholder")}
											autoCapitalize="none"
											autoComplete="email"
											autoCorrect="off"
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
							name="password"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between">
										<FormLabel>{t("login.password")}</FormLabel>
										<Link
											href="/forgot-password"
											className="text-sm font-medium text-primary hover:underline"
										>
											{t("login.forgot")}
										</Link>
									</div>
									<FormControl>
										<PasswordInput
											visible={showPassword}
											onToggleVisible={() => setShowPassword((v) => !v)}
											placeholder="••••••••"
											autoComplete="current-password"
											readOnly={isSubmitting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button disabled={isSubmitting} className="mt-2">
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("login.submit")}
						</Button>
					</form>
				</Form>

				<SocialLogin
					providers={providers}
					audience={audience}
					oauthError={oauthError}
					disabled={isSubmitting}
				/>
			</div>

			{isClient && (
				<p className="text-center text-sm text-muted-foreground">
					<Link
						href={AUTH_PATHS.client.phone}
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						{t("phone.useInstead")}
					</Link>
				</p>
			)}

			<p className="px-8 text-center text-sm text-muted-foreground">
				{t("login.noAccount")}{" "}
				<Link
					href={paths.register}
					className="underline underline-offset-4 hover:text-primary"
				>
					{t("login.signUp")}
				</Link>
			</p>
		</div>
	);
}
