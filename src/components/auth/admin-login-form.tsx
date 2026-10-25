"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { House, Loader2, ShieldCheck } from "lucide-react";
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
import { ADMIN_PATHS } from "@/lib/auth/admin-paths";
import { authClient } from "@/lib/auth/client";
import { ROLES } from "@/lib/auth/roles";
import { AuthHeading } from "./auth-heading";
import { PasswordInput } from "./password-input";
import { type LoginValues, loginSchema } from "./schemas";
import { useAuthError } from "./use-auth-error";

/**
 * The administrators' sign-in: email and password only. No social buttons and
 * no sign-up, because admin accounts are created on the server.
 */
export function AdminLoginForm() {
	const t = useTranslations("Auth");
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
			if (error) return void toast.error(authError.message(error));
			// Only administrators stay signed in here.
			if (data?.user.role !== ROLES.admin) {
				await authClient.signOut();
				return void toast.error(t("adminLogin.notAdmin"));
			}
			toast.success(t("login.success"));
			window.location.assign(ADMIN_PATHS.home);
		} catch {
			toast.error(authError.network);
		}
	}

	return (
		<div className="flex flex-col space-y-6">
			<Link
				href="/"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<House className="h-4 w-4" />
				{t("backLink.home")}
			</Link>
			<AuthHeading
				title={t("adminLogin.title")}
				description={t("adminLogin.description")}
				badge={
					<span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
						<ShieldCheck className="h-3.5 w-3.5" />
						{t("adminLogin.badge")}
					</span>
				}
			/>
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
										autoCapitalize="none"
										autoComplete="username"
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
								<FormLabel>{t("login.password")}</FormLabel>
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
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("login.submit")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
