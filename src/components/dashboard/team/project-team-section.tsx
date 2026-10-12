"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { InviteStatusBadge } from "@/components/dashboard/projects/invite-status-badge";
import { TextField } from "@/components/dashboard/shared/form-fields";
import { SearchPicker } from "@/components/dashboard/shared/search-picker";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	assignTeamMember,
	findMyTeamMembers,
	unassignTeamMember,
} from "@/services/team/actions";
import { type AssignValues, assignSchema } from "@/services/team/schemas";
import type { ProjectAssignmentItem } from "@/services/team/types";

/** The crew of a project: who is on it and as what. */
export function ProjectTeamSection({
	projectId,
	assignments,
}: {
	projectId: string;
	assignments: ProjectAssignmentItem[];
}) {
	const t = useTranslations("Team.project");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [isPending, startTransition] = useTransition();

	const unassign = (assignmentId: string) =>
		startTransition(async () => {
			const result = await unassignTeamMember({ projectId, assignmentId });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("removed"));
			router.refresh();
		});

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">{t("title")}</h2>
				<AssignDialog projectId={projectId} />
			</div>
			{assignments.length === 0 ? (
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<UsersRound className="h-3.5 w-3.5" />
					{t("none")}
				</p>
			) : (
				<ul className="flex flex-wrap gap-2">
					{assignments.map((assignment) => (
						<li
							key={assignment.id}
							className="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pl-2.5 pr-1 text-xs"
						>
							<span className="font-medium">{assignment.member.name}</span>
							{(assignment.role || assignment.member.specialty) && (
								<span className="text-muted-foreground">
									{assignment.role || assignment.member.specialty}
								</span>
							)}
							<InviteStatusBadge status={assignment.member.status} />
							<Button
								variant="ghost"
								size="icon"
								className="h-5 w-5"
								aria-label={t("remove")}
								disabled={isPending}
								onClick={() => unassign(assignment.id)}
							>
								<X className="h-3 w-3" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function AssignDialog({ projectId }: { projectId: string }) {
	const t = useTranslations("Team.project");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const [picked, setPicked] = useState("");
	const empty = { projectId, memberId: "", role: "" };
	const form = useForm<AssignValues>({
		resolver: zodResolver(assignSchema),
		defaultValues: empty,
	});
	const { isSubmitting } = form.formState;

	async function onSubmit(values: AssignValues) {
		const result = await assignTeamMember(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("assigned"));
		setOpen(false);
		router.refresh();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					form.reset(empty);
					setPicked("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
					<UserPlus className="h-3.5 w-3.5" />
					{t("assign")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t("assignTitle")}</DialogTitle>
					<DialogDescription>{t("assignDescription")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						<FormField
							control={form.control}
							name="memberId"
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel className="text-xs">{t("member")}</FormLabel>
									<SearchPicker
										search={findMyTeamMembers}
										value={picked}
										placeholder={t("memberPlaceholder")}
										searchPlaceholder={t("search")}
										emptyLabel={t("noMatch")}
										onPick={(option) => {
											field.onChange(option.id);
											setPicked(option.label);
										}}
									/>
									<FormMessage className="text-xs" />
								</FormItem>
							)}
						/>
						<TextField<AssignValues>
							name="role"
							label={t("role")}
							placeholder={t("rolePlaceholder")}
						/>
						<DialogFooter>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
