"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, FolderSync, Loader2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	SwitchField,
	TextField,
} from "@/components/dashboard/shared/form-fields";
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
import { Progress } from "@/components/ui/progress";
import { useErrorMessage } from "@/hooks/use-error-message";
import {
	type OrganizeSummary,
	organizedName,
	prefixSchema,
} from "@/services/galleries/organize";
import {
	organizeGallery,
	readGalleryMetadata,
	restoreOriginalNames,
} from "@/services/galleries/organize-actions";

const schema = z
	.object({ sort: z.boolean(), rename: z.boolean(), prefix: z.string() })
	.superRefine((v, ctx) => {
		if (!v.rename) return;
		const prefix = prefixSchema.safeParse(v.prefix);
		if (!prefix.success)
			ctx.addIssue({
				code: "custom",
				path: ["prefix"],
				message: prefix.error.issues[0]?.message ?? "invalidInput",
			});
	});
type Values = z.infer<typeof schema>;

/**
 * Reads when and with what each file was shot, then puts the gallery in
 * shooting order and renames the files after one pattern.
 */
export function OrganizeDialog({
	galleryId,
	summary,
}: {
	galleryId: string;
	summary: OrganizeSummary;
}) {
	const t = useTranslations("Galleries.organize");
	const format = useFormatter();
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const [open, setOpen] = useState(false);
	const [reading, setReading] = useState(false);
	const [isPending, startTransition] = useTransition();
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { sort: true, rename: true, prefix: summary.defaultPrefix },
	});
	const [rename, prefix] = useWatch({
		control: form.control,
		name: ["rename", "prefix"],
	});
	const read = summary.total - summary.pending;

	// Opening the dialog reads whatever metadata is still missing.
	useEffect(() => {
		if (!open || summary.pending === 0 || reading) return;
		setReading(true);
		(async () => {
			while (true) {
				const result = await readGalleryMetadata(galleryId);
				if (!result.ok) {
					toast.error(errorMessage(result.error));
					break;
				}
				router.refresh();
				if (result.data.remaining === 0) break;
			}
			setReading(false);
		})();
	}, [open, summary.pending, reading, galleryId, router, errorMessage]);

	const onSubmit = (values: Values) =>
		startTransition(async () => {
			const result = await organizeGallery({ galleryId, ...values });
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("done"));
			setOpen(false);
			router.refresh();
		});

	const restore = () =>
		startTransition(async () => {
			const result = await restoreOriginalNames(galleryId);
			if (!result.ok) return void toast.error(errorMessage(result.error));
			toast.success(t("restored"));
			router.refresh();
		});

	const day = (iso: string) =>
		format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });
	const example =
		rename && prefixSchema.safeParse(prefix).success
			? organizedName(prefix, new Date(summary.firstAt ?? Date.now()), 0, "jpg")
			: null;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
					<FolderSync className="h-3.5 w-3.5" />
					{t("button")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				{summary.pending > 0 ? (
					<div className="flex flex-col gap-2 py-2">
						<p className="flex items-center gap-2 text-xs text-muted-foreground">
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							{t("reading", { count: read, total: summary.total })}
						</p>
						<Progress
							value={(read / Math.max(1, summary.total)) * 100}
							className="h-1.5"
						/>
					</div>
				) : (
					<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
						{summary.firstAt && summary.lastAt && (
							<p>
								{t("range", {
									from: day(summary.firstAt),
									to: day(summary.lastAt),
								})}
							</p>
						)}
						<ul className="flex flex-wrap gap-1.5">
							{summary.sources.map((source) => (
								<li
									key={source.camera ?? "unknown"}
									className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5"
								>
									<Camera className="h-3 w-3 text-muted-foreground" />
									{source.camera ?? t("unknownSource")} · {source.count}
								</li>
							))}
						</ul>
						{summary.undated > 0 && (
							<p className="text-muted-foreground">
								{t("undated", { count: summary.undated })}
							</p>
						)}
					</div>
				)}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-3"
					>
						<SwitchField<Values>
							name="sort"
							label={t("sort")}
							description={t("sortHint")}
						/>
						<SwitchField<Values>
							name="rename"
							label={t("rename")}
							description={t("renameHint")}
						/>
						{rename && (
							<TextField<Values>
								name="prefix"
								label={t("prefix")}
								description={
									example ? t("example", { name: example }) : undefined
								}
							/>
						)}
						<DialogFooter className="gap-2 sm:justify-between">
							{summary.renamed > 0 ? (
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="gap-1.5"
									disabled={isPending}
									onClick={restore}
								>
									<Undo2 className="h-3.5 w-3.5" />
									{t("restore")}
								</Button>
							) : (
								<span />
							)}
							<Button
								type="submit"
								size="sm"
								disabled={isPending || summary.pending > 0}
							>
								{isPending && (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								)}
								{t("apply")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
