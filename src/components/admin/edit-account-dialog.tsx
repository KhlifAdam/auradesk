"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateAccount } from "@/services/admin/account-actions";
import {
	type AccountFields,
	accountFieldsSchema,
} from "@/services/admin/schemas";
import { useAdminAction } from "./use-admin-action";

const FIELDS = [
	{ name: "name", type: "text", autoComplete: "name" },
	{ name: "email", type: "email", autoComplete: "email" },
	{ name: "phone", type: "tel", autoComplete: "tel" },
] as const;

/** Lets the admin correct an account's name, email or phone number. */
export function EditAccountDialog({
	userId,
	initial,
}: {
	userId: string;
	initial: AccountFields;
}) {
	const t = useTranslations("Admin.edit");
	const [open, setOpen] = useState(false);
	const { isPending, run } = useAdminAction();
	const form = useForm<AccountFields>({
		resolver: zodResolver(accountFieldsSchema),
		defaultValues: initial,
	});

	const onSubmit = (values: AccountFields) =>
		run(
			() => updateAccount({ userId, values }),
			t("done"),
			() => setOpen(false),
		);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(initial);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
					<Pencil className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						{FIELDS.map(({ name, type, autoComplete }) => (
							<FormField
								key={name}
								control={form.control}
								name={name}
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormLabel className="text-xs">{t(name)}</FormLabel>
										<FormControl>
											<Input
												type={type}
												autoComplete={autoComplete}
												className="h-8 text-sm"
												{...field}
											/>
										</FormControl>
										<FormMessage className="text-xs" />
									</FormItem>
								)}
							/>
						))}
						<p className="text-[11px] text-muted-foreground">{t("hint")}</p>
						<DialogFooter>
							<Button
								type="submit"
								size="sm"
								className="h-8 text-xs"
								disabled={isPending}
							>
								{isPending && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("submit")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
