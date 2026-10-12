"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/components/dashboard/shared/form-fields";
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
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { inviteTeamMember } from "@/services/team/actions";
import { type MemberValues, memberSchema } from "@/services/team/schemas";

const EMPTY: MemberValues = { name: "", email: "", specialty: "" };

/** Invites a collaborator by email; they join once they accept. */
export function InviteMemberDialog() {
	const t = useTranslations("Team.invite");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const form = useForm<MemberValues>({
		resolver: zodResolver(memberSchema),
		defaultValues: EMPTY,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: MemberValues) {
		const result = await inviteTeamMember(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		if (result.data.emailed) toast.success(t("sent"));
		else toast.warning(t("savedNotEmailed"));
		setOpen(false);
		router.refresh();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(EMPTY);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" className="h-8 gap-1.5 text-xs">
					<UserPlus className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						<TextField<MemberValues> name="name" label={t("name")} required />
						<TextField<MemberValues>
							name="email"
							label={t("email")}
							type="email"
							required
						/>
						<TextField<MemberValues>
							name="specialty"
							label={t("specialty")}
							placeholder={t("specialtyPlaceholder")}
						/>
						<DialogFooter>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
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
