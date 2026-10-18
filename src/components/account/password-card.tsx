"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { useAuthError } from "@/components/auth/use-auth-error";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth/client";

const schema = z
	.object({
		currentPassword: z.string().min(1, "required"),
		newPassword: z.string().min(8, "passwordTooShort"),
		confirmPassword: z.string(),
	})
	.refine((v) => v.newPassword === v.confirmPassword, {
		path: ["confirmPassword"],
		message: "passwordsDontMatch",
	});
type Values = z.infer<typeof schema>;
const FIELDS = ["currentPassword", "newPassword", "confirmPassword"] as const;
const EMPTY: Values = {
	currentPassword: "",
	newPassword: "",
	confirmPassword: "",
};

/** Changes the password; every other device is signed out at the same time. */
export function PasswordCard() {
	const t = useTranslations("Account.password");
	const authError = useAuthError();
	const [visible, setVisible] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: EMPTY,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit({ currentPassword, newPassword }: Values) {
		const { error } = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true,
		});
		if (error) return void toast.error(authError.message(error));
		toast.success(t("changed"));
		form.reset(EMPTY);
	}

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div>
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<p className="text-xs text-muted-foreground">{t("hint")}</p>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid gap-2 sm:grid-cols-3"
				>
					{FIELDS.map((name) => (
						<FormField
							key={name}
							control={form.control}
							name={name}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel className="text-xs">{t(name)}</FormLabel>
									<FormControl>
										<PasswordInput
											visible={visible}
											onToggleVisible={
												name === "currentPassword"
													? () => setVisible((v) => !v)
													: undefined
											}
											autoComplete={
												name === "currentPassword"
													? "current-password"
													: "new-password"
											}
											className="h-8 text-sm"
											{...field}
										/>
									</FormControl>
									<FormMessage className="text-xs" />
								</FormItem>
							)}
						/>
					))}
					<Button
						type="submit"
						size="sm"
						className="h-8 w-fit text-xs sm:col-span-3"
						disabled={isSubmitting}
					>
						{isSubmitting && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{t("submit")}
					</Button>
				</form>
			</Form>
		</section>
	);
}
