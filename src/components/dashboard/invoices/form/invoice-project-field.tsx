"use client";

import { FolderKanban, Info, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { SearchPicker } from "@/components/dashboard/shared/search-picker";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";
import type {
	ProjectInvoiceDraft,
	ProjectInvoiceKind,
} from "@/services/invoices/prefill";
import {
	findClientOpenProjects,
	findInvoiceProjects,
	loadProjectInvoiceDraft,
} from "@/services/invoices/project-draft-actions";
import type { InvoiceValues } from "@/services/invoices/schemas";

export interface LinkedProject {
	title: string;
	/** What the lines are; unknown when editing an existing invoice. */
	kind: ProjectInvoiceKind | null;
	quote: { id: string; number: string } | null;
}

/**
 * Which project the invoice bills. Picking one fills the client and the
 * lines it should bill (its accepted quote, its price, or what is left);
 * none makes it a standalone invoice, said plainly.
 */
export function InvoiceProjectField({
	initial,
}: {
	initial: LinkedProject | null;
}) {
	const t = useTranslations("Invoices.draft");
	const errorMessage = useErrorMessage();
	const { setValue, control } = useFormContext<InvoiceValues>();
	const [projectId, clientId] = useWatch({
		control,
		name: ["projectId", "clientId"],
	});
	const [project, setProject] = useState(initial);
	const [open, setOpen] = useState<{ id: string; title: string }[]>([]);
	const [pending, startTransition] = useTransition();

	// A client with projects still to bill: offer to link one.
	useEffect(() => {
		if (projectId || !clientId) return setOpen([]);
		let stale = false;
		findClientOpenProjects(clientId).then((result) => {
			if (!stale) setOpen(result.ok ? result.data : []);
		});
		return () => {
			stale = true;
		};
	}, [projectId, clientId]);

	const apply = (draft: ProjectInvoiceDraft) => {
		for (const [name, value] of Object.entries(draft.values))
			setValue(name as keyof InvoiceValues, value as never, {
				shouldDirty: true,
			});
		setProject({
			title: draft.projectTitle,
			kind: draft.kind,
			quote: draft.quote,
		});
	};
	const link = (id: string) =>
		startTransition(async () => {
			const result = await loadProjectInvoiceDraft(id);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			apply(result.data);
		});
	const unlink = () => {
		setValue("projectId", "", { shouldDirty: true });
		setProject(null);
	};

	if (projectId && project)
		return (
			<div className="flex flex-col gap-2">
				<div className="flex w-fit items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 py-1 pl-2.5 pr-1 text-xs font-medium">
					<FolderKanban className="h-3.5 w-3.5 text-primary" />
					{t("forProject", { title: project.title })}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						aria-label={t("unlink")}
						onClick={unlink}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
				{project.kind && (
					<p
						className={cn(
							"flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
							project.kind === "invoiced"
								? "border border-warning/40 bg-warning/10"
								: "bg-muted/50 text-muted-foreground",
						)}
					>
						<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
						<span>
							{t(`kind.${project.kind}`, {
								number: project.quote?.number ?? "",
							})}{" "}
							{project.quote && (
								<Link
									href={`/dashboard/invoices/quotes/${project.quote.id}`}
									className="font-medium text-primary underline-offset-2 hover:underline"
								>
									{t("openQuote")}
								</Link>
							)}
						</span>
					</p>
				)}
			</div>
		);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-2">
				<SearchPicker
					search={findInvoiceProjects}
					value=""
					placeholder={t("pick")}
					searchPlaceholder={t("search")}
					emptyLabel={t("noMatch")}
					onPick={(option) => link(option.id)}
					className="w-64"
				/>
				{pending && <Loader2 className="h-4 w-4 animate-spin" />}
				<span className="text-xs text-muted-foreground">{t("standalone")}</span>
			</div>
			{open.length > 0 && (
				<div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
					<span>{t("openHint", { count: open.length })}</span>
					{open.map((item) => (
						<Button
							key={item.id}
							type="button"
							size="sm"
							variant="outline"
							className="h-6 px-2 text-xs"
							disabled={pending}
							onClick={() => link(item.id)}
						>
							{item.title}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}
