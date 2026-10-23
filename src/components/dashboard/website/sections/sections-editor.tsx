"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { SortableList } from "@/components/dashboard/shared/sortable-list";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { saveSiteSections } from "@/services/site-sections/actions";
import type { SectionsEditorData } from "@/services/site-sections/queries";
import {
	type SectionsValues,
	saveSectionsSchema,
} from "@/services/site-sections/schemas";
import { SectionMediaContext } from "./media-form-field";
import { SectionRow } from "./section-row";

/** Order, show or hide, and fill the sections of the public site. */
export function SectionsEditor({
	data,
	siteUrl,
}: {
	data: SectionsEditorData;
	/** The live site, when it is published. */
	siteUrl: string | null;
}) {
	const t = useTranslations("Site.sections");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<SectionsValues>({
		resolver: zodResolver(saveSectionsSchema),
		defaultValues: { sections: data.sections },
	});
	const { fields, move } = useFieldArray({
		control: form.control,
		name: "sections",
	});
	const { isSubmitting, isDirty } = form.formState;

	async function onSubmit(values: SectionsValues) {
		const result = await saveSiteSections(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("saved"));
		form.reset(values);
		router.refresh();
	}

	return (
		<SectionMediaContext.Provider value={data.media}>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit, () =>
						toast.error(t("invalid")),
					)}
					className="flex max-w-3xl flex-col gap-4"
				>
					<p className="text-xs text-muted-foreground">{t("orderHint")}</p>
					<SortableList
						items={fields}
						onMove={move}
						className="flex flex-col gap-2"
						renderItem={(field, index, handle) => (
							<SectionRow index={index} kind={field.kind} handle={handle} />
						)}
					/>
					<div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-xl border border-border bg-background/80 p-2 backdrop-blur-xl">
						{siteUrl && (
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="h-8 gap-1.5 text-xs"
							>
								<a href={siteUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="h-3.5 w-3.5" />
									{t("viewSite")}
								</a>
							</Button>
						)}
						<Button
							type="submit"
							size="sm"
							className="h-8 text-xs"
							disabled={isSubmitting || !isDirty}
						>
							{isSubmitting && (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							)}
							{t("save")}
						</Button>
					</div>
				</form>
			</Form>
		</SectionMediaContext.Provider>
	);
}
