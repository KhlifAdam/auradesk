"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSaveBar } from "@/components/dashboard/shared/form-save-bar";
import { Form } from "@/components/ui/form";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { PreviewParams } from "@/services/preview/preview-params";
import { updateAppearance } from "@/services/studio/actions";
import {
	type AppearanceValues,
	appearanceSchema,
	designSchema,
} from "@/services/studio/schemas";
import type { StudioData } from "@/services/studio/types";
import {
	AccentSection,
	FontsSection,
	TemplateSection,
} from "./design-sections";
import { LanguagesSection, ThemeModeSection } from "./site-options-sections";

/** What the preview shows for these choices; a half-typed color keeps the saved one. */
function toPreview(
	values: Partial<AppearanceValues>,
	savedAccent: string,
): PreviewParams {
	const accent = designSchema.shape.accentColor.safeParse(values.accentColor);
	return {
		template: values.template,
		accent: accent.success ? accent.data : savedAccent,
		font: values.fontPair,
		mode: values.themeMode,
		lang: values.defaultLocale,
	};
}

export function AppearanceForm({
	studio,
	onPreviewChange,
}: {
	studio: StudioData;
	/** Receives the unsaved choices, for the live preview. */
	onPreviewChange: (params: PreviewParams) => void;
}) {
	const t = useTranslations("Site.appearance");
	const router = useRouter();
	const errorMessage = useErrorMessage();
	const form = useForm<AppearanceValues>({
		resolver: zodResolver(appearanceSchema),
		defaultValues: {
			template: studio.template,
			accentColor: studio.accentColor,
			fontPair: studio.fontPair,
			themeMode: studio.themeMode,
			locales: studio.locales,
			defaultLocale: studio.defaultLocale,
		},
	});
	const { isDirty, isSubmitting } = form.formState;

	useEffect(() => {
		const send = (values: Partial<AppearanceValues>) =>
			onPreviewChange(toPreview(values, studio.accentColor));
		send(form.getValues());
		const subscription = form.watch((values) =>
			send(values as Partial<AppearanceValues>),
		);
		return () => subscription.unsubscribe();
	}, [form, onPreviewChange, studio.accentColor]);

	async function onSubmit(next: AppearanceValues) {
		const result = await updateAppearance(next);
		if (!result.ok) return toast.error(errorMessage(result.error));
		form.reset(next);
		toast.success(t("saved"));
		router.refresh();
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<TemplateSection />
				<ThemeModeSection />
				<div className="grid gap-4 lg:grid-cols-2">
					<FontsSection />
					<AccentSection />
				</div>
				<LanguagesSection />
				<FormSaveBar
					visible={isDirty}
					isSubmitting={isSubmitting}
					onReset={() => form.reset()}
				/>
			</form>
		</Form>
	);
}
