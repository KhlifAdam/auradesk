"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { setInitialPassword } from "@/services/account/password-actions";
import { setPasswordSchema } from "@/services/account/schemas";

const schema = setPasswordSchema
	.extend({ confirmPassword: z.string() })
	.refine((v) => v.newPassword === v.confirmPassword, {
		path: ["confirmPassword"],
		message: "passwordsDontMatch",
	});
type Values = z.infer<typeof schema>;
const FIELDS = ["newPassword", "confirmPassword"] as const;

/**
 * A first password for an account that signed in with a phone code (or
 * Google). Needs a verified email, since password sign-in uses it; until then
 * it points to the profile, where the email is added.
 */
export function SetPasswordCard({
	hasEmail,
	profileHref,
}: {
	/** The account has a real, verified email. */
	hasEmail: boolean;
	profileHref: string;
}) {
	const t = useTranslations("Account.setPassword");
	const errorMessage = useErrorMessage();
	const router = useRouter();
	const [visible, setVisible] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { newPassword: "", confirmPassword: "" },
	});
	const { isSubmitting } = form.formState;

	async function onSubmit({ newPassword }: Values) {
		const result = await setInitialPassword({ newPassword });
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("done"));
		router.refresh();
	}

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div>
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<p className="text-xs text-muted-foreground">
					{hasEmail ? t("hint") : t("needsEmail")}
				</p>
			</div>
			{hasEmail ? (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid gap-2 sm:grid-cols-2"
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
													name === "newPassword"
														? () => setVisible((v) => !v)
														: undefined
												}
												autoComplete="new-password"
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
							className="h-8 w-fit text-xs sm:col-span-2"
							disabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							)}
							{t("submit")}
						</Button>
					</form>
				</Form>
			) : (
				<Button
					asChild
					size="sm"
					variant="outline"
					className="h-8 w-fit text-xs"
				>
					<Link href={profileHref}>
						{t("addEmail")}
						<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
					</Link>
				</Button>
			)}
		</section>
	);
}
