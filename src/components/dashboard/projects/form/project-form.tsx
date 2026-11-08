"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { createProject, updateProject } from "@/services/projects/actions";
import {
	type CreateProjectValues,
	createProjectSchema,
} from "@/services/projects/schemas";
import { ClientSection } from "./client-section";
import { FinanceSection } from "./finance-section";
import { GeneralSection } from "./general-section";
import { PlanningSection } from "./planning-section";
import { TeamSection } from "./team-section";

interface ProjectFormProps {
	initial: CreateProjectValues;
	/** Edit mode when set. */
	projectId?: string;
	/** Discounts on the project's issued invoices (edit mode). */
	discount?: number;
}

export function ProjectForm({
	initial,
	projectId,
	discount = 0,
}: ProjectFormProps) {
	const t = useTranslations("Projects.form");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<CreateProjectValues>({
		// In edit mode the email stays empty, which the schema accepts.
		resolver: zodResolver(createProjectSchema),
		defaultValues: initial,
	});
	const { isSubmitting } = form.formState;
	const cancelHref = projectId
		? `/dashboard/projects/${projectId}`
		: "/dashboard/projects";

	async function onSubmit({
		clientEmail,
		invitePhone,
		...values
	}: CreateProjectValues) {
		if (projectId) {
			const result = await updateProject({ ...values, id: projectId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("updated"));
			router.push(cancelHref);
			return router.refresh();
		}
		const result = await createProject({ ...values, clientEmail, invitePhone });
		if (!result.ok) return void toast.error(errorMessage(result.error));
		const invited = Boolean(clientEmail) || invitePhone;
		if (invited && !result.data.sent) toast.warning(t("createdEmailFailed"));
		else toast.success(invited ? t("createdInvited") : t("created"));
		router.push(`/dashboard/projects/${result.data.id}`);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex max-w-3xl flex-col gap-4"
			>
				<GeneralSection />
				<ClientSection isEdit={Boolean(projectId)} />
				<PlanningSection />
				<FinanceSection discount={discount} />
				<TeamSection />
				<div className="sticky bottom-4 z-20 flex justify-end gap-2 rounded-xl border border-border bg-card/80 p-3 backdrop-blur-md">
					<Button asChild type="button" variant="ghost" size="sm">
						<Link href={cancelHref}>{t("cancel")}</Link>
					</Button>
					<Button type="submit" size="sm" disabled={isSubmitting}>
						{isSubmitting && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{projectId ? t("save") : t("create")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
