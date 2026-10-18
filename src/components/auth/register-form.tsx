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
	AUTH_PATHS,
	type AuthAudience,
	verifyEmailPath,
} from "@/lib/auth/client-intent";
import type { SocialProvider } from "@/lib/auth/social-providers";
import {
	clearClientIntent,
	setClientIntent,
} from "@/services/auth/intent-actions";
import { AudienceBadge } from "./audience-badge";
import { AuthBackLink } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";
import { PasswordInput } from "./password-input";
import {
	clientRegisterSchema,
	type RegisterValues,
	registerSchema,
} from "./schemas";
import { SocialLogin } from "./social-login";
import { useAuthError } from "./use-auth-error";

interface RegisterFormProps {
	audience: AuthAudience;
	providers: SocialProvider[];
	/** Pre-filled from an invitation link. */
	defaultEmail?: string;
}

export function RegisterForm({
	audience,
	providers,
	defaultEmail = "",
}: RegisterFormProps) {
	const t = useTranslations("Auth");
	const authError = useAuthError();
	const isClient = audience === "client";
	const paths = AUTH_PATHS[audience];
	const [showPasswords, setShowPasswords] = useState(false);
	const form = useForm<RegisterValues>({
		resolver: zodResolver(isClient ? clientRegisterSchema : registerSchema),
		defaultValues: {
			name: "",
			email: defaultEmail,
			password: "",
			confirmPassword: "",
		},
	});
	const { isSubmitting } = form.formState;

	async function onSubmit({ name, email, password }: RegisterValues) {
		try {
			// The intent cookie gives the new account the client role.
			await (isClient ? setClientIntent() : clearClientIntent());
			const { error } = await authClient.signUp.email({
				email,
				password,
				// Photographers name their studio later; start from the local part.
				name: name || email.split("@")[0] || email,
			});
			if (error) return void toast.error(authError.message(error));
			// No session yet: the account opens once the emailed code is entered.
			toast.success(t("register.success"));
			window.location.assign(verifyEmailPath(email, audience));
		} catch {
			toast.error(authError.network);
		}
	}

	return (
		<div className="flex flex-col space-y-6">
			<AuthBackLink audience={audience} />
			<AuthHeading
				title={t(isClient ? "client.register.title" : "register.title")}
				description={t(
					isClient ? "client.register.description" : "register.description",
				)}
				badge={<AudienceBadge audience={audience} />}
				highlights={t(`highlights.${audience}`)}
			/>

			<div className="grid gap-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
						{isClient && (
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("client.register.name")}</FormLabel>
										<FormControl>
											<Input
												autoComplete="name"
												placeholder={t("shared.namePlaceholder")}
												readOnly={isSubmitting}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("register.email")}</FormLabel>
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
									<FormLabel>{t("register.password")}</FormLabel>
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
									<FormLabel>{t("register.confirmPassword")}</FormLabel>
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
						<Button disabled={isSubmitting} className="mt-2">
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("register.submit")}
						</Button>
					</form>
				</Form>

				<SocialLogin
					providers={providers}
					audience={audience}
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
				{t("register.haveAccount")}{" "}
				<Link
					href={paths.login}
					className="underline underline-offset-4 hover:text-primary"
				>
					{t("register.signIn")}
				</Link>
			</p>
		</div>
	);
}
