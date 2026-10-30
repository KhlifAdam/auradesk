"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSaveBar } from "@/components/dashboard/shared/form-save-bar";
import { SortableList } from "@/components/dashboard/shared/sortable-list";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import { saveSiteSections } from "@/services/site-sections/actions";
import type { SectionsEditorData } from "@/services/site-sections/queries";
import {
	type SectionsValues,
	saveSectionsSchema,
} from "@/services/site-sections/schemas";
import { SectionAlbumsContext } from "./album-picker";
import { SectionMediaContext } from "./media-form-field";
import { SectionRow } from "./section-row";
import { type SectionsDraft, useSectionsDraft } from "./use-sections-draft";

/** An entry added but left completely blank. */
const isBlank = (item: object) =>
	Object.values(item).every((value) => value === "" || value === null);

/** Drops blank entries, so an unused "Add" doesn't block saving. */
const withoutBlankItems = (sections: SectionsValues["sections"]) =>
	sections.map((section) =>
		"items" in section
			? { ...section, items: section.items.filter((item) => !isBlank(item)) }
			: section,
	) as SectionsValues["sections"];

/** Order, show or hide, and fill the sections of the public site. */
export function SectionsEditor({
	data,
	onDraft,
}: {
	data: SectionsEditorData;
	/** Receives the unsaved sections' state, for the live preview. */
	onDraft: (draft: SectionsDraft) => void;
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
	const { focusOn } = useSectionsDraft(form, onDraft);

	async function onSubmit(values: SectionsValues) {
		const result = await saveSiteSections(values);
		if (!result.ok) return void toast.error(errorMessage(result.error));
		toast.success(t("saved"));
		form.reset(values);
		router.refresh();
	}

	return (
		<SectionAlbumsContext.Provider value={data.albums}>
			<SectionMediaContext.Provider value={data.media}>
				<Form {...form}>
					<form
						onSubmit={(event) => {
							form.setValue(
								"sections",
								withoutBlankItems(form.getValues("sections")),
							);
							return form.handleSubmit(onSubmit, () =>
								toast.error(t("invalid")),
							)(event);
						}}
						className="flex flex-col gap-4"
					>
						<p className="text-xs text-muted-foreground">{t("orderHint")}</p>
						<SortableList
							items={fields}
							onMove={(from, to) => {
								focusOn(fields[from].kind);
								move(from, to);
							}}
							className="flex flex-col gap-2"
							renderItem={(field, index, handle) => (
								<SectionRow index={index} kind={field.kind} handle={handle} />
							)}
						/>
						<FormSaveBar
							visible={isDirty}
							isSubmitting={isSubmitting}
							onReset={() => form.reset()}
						/>
					</form>
				</Form>
			</SectionMediaContext.Provider>
		</SectionAlbumsContext.Provider>
	);
}
