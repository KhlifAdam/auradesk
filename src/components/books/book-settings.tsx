"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { BookMeta } from "@/lib/books/design-reducer";
import {
	BACKGROUND_HEX,
	BOOK_BACKGROUNDS,
	BOOK_FORMATS,
	BOOK_MARGINS,
	BOOK_SIZES_MM,
} from "@/lib/books/formats";
import { cn } from "@/lib/utils";

interface BookSettingsProps {
	meta: BookMeta;
	onChange: (patch: Partial<BookMeta>) => void;
}

/** One-of-a-few choice; clicking the chosen one again keeps it. */
function Choice<T extends string>({
	value,
	onChange,
	options,
}: {
	value: T;
	onChange: (value: T) => void;
	options: { value: T; label: string }[];
}) {
	return (
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			value={value}
			onValueChange={(next) => next && onChange(next as T)}
			className="flex-wrap justify-start"
		>
			{options.map((option) => (
				<ToggleGroupItem
					key={option.value}
					value={option.value}
					className="h-8 px-2.5 text-xs"
				>
					{option.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

/** The book as a whole: its names, size, spacing and colours. Changes apply at once. */
export function BookSettings({ meta, onChange }: BookSettingsProps) {
	const t = useTranslations("PhotoBook.editor.settings");
	const form = useForm<BookMeta>({ defaultValues: meta });

	useEffect(() => {
		const subscription = form.watch((values) => onChange(values as BookMeta));
		return () => subscription.unsubscribe();
	}, [form, onChange]);

	return (
		<Form {...form}>
			<form
				className="flex flex-col gap-4"
				onSubmit={(e) => e.preventDefault()}
			>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-xs">{t("title")}</FormLabel>
							<FormControl>
								<Input
									maxLength={80}
									placeholder={t("titlePlaceholder")}
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="subtitle"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-xs">{t("subtitle")}</FormLabel>
							<FormControl>
								<Input
									maxLength={120}
									placeholder={t("subtitlePlaceholder")}
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="format"
					render={({ field }) => (
						<FormItem className="gap-2">
							<FormLabel className="text-xs">{t("format")}</FormLabel>
							<Choice
								value={field.value}
								onChange={field.onChange}
								options={BOOK_FORMATS.map((format) => ({
									value: format,
									label: `${t(`formats.${format}`)} · ${BOOK_SIZES_MM[format].w / 10}×${BOOK_SIZES_MM[format].h / 10} cm`,
								}))}
							/>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="margin"
					render={({ field }) => (
						<FormItem className="gap-2">
							<FormLabel className="text-xs">{t("margin")}</FormLabel>
							<Choice
								value={field.value}
								onChange={field.onChange}
								options={BOOK_MARGINS.map((margin) => ({
									value: margin,
									label: t(`margins.${margin}`),
								}))}
							/>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="background"
					render={({ field }) => (
						<FormItem className="gap-2">
							<FormLabel className="text-xs">{t("background")}</FormLabel>
							<div className="flex gap-2">
								{BOOK_BACKGROUNDS.map((background) => (
									<button
										key={background}
										type="button"
										aria-label={t(`backgrounds.${background}`)}
										aria-pressed={field.value === background}
										title={t(`backgrounds.${background}`)}
										onClick={() => field.onChange(background)}
										className={cn(
											"h-8 w-8 cursor-pointer rounded-full border border-border transition-shadow duration-200",
											field.value === background &&
												"ring-2 ring-primary ring-offset-2 ring-offset-background",
										)}
										style={{ backgroundColor: BACKGROUND_HEX[background] }}
									/>
								))}
							</div>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="titleTone"
					render={({ field }) => (
						<FormItem className="gap-2">
							<FormLabel className="text-xs">{t("titleTone")}</FormLabel>
							<Choice
								value={field.value}
								onChange={field.onChange}
								options={[
									{ value: "light", label: t("tones.light") },
									{ value: "dark", label: t("tones.dark") },
								]}
							/>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
