"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";
import { TextField } from "@/components/dashboard/shared/form-fields";
import {
	SECTION_LIMITS,
	type SectionKind,
	type SectionsValues,
} from "@/services/site-sections/schemas";
import { ItemList } from "./item-list";
import { MediaFormField } from "./media-form-field";

type V = SectionsValues;
type ListKind = keyof typeof SECTION_LIMITS;

const EMPTY_ITEM = {
	clients: { name: "", url: "", logoId: null },
	testimonials: { quote: "", author: "", role: "", photoId: null },
	stats: { value: "", label: "" },
	faq: { question: "", answer: "" },
} as const;

/** The repeated entries of one list section, bound to the form. */
function ListEditor({ index, kind }: { index: number; kind: ListKind }) {
	const t = useTranslations("Site.sections.fields");
	const { control } = useFormContext<V>();
	const { fields, append, remove, move } = useFieldArray({
		control,
		// Every list section stores its entries under `items`.
		name: `sections.${index}.items` as `sections.${number}.items`,
	});
	const path = (item: number, key: string) =>
		`sections.${index}.items.${item}.${key}` as `sections.${number}.title`;

	const fieldsFor = (item: number) => {
		switch (kind) {
			case "clients":
				return (
					<div className="grid gap-3 sm:grid-cols-[auto_1fr]">
						<MediaFormField<V> name={path(item, "logoId")} label={t("logo")} />
						<div className="grid gap-3">
							<TextField<V> name={path(item, "name")} label={t("clientName")} />
							<TextField<V>
								name={path(item, "url")}
								label={t("clientUrl")}
								type="url"
								placeholder="https://"
							/>
						</div>
					</div>
				);
			case "testimonials":
				return (
					<div className="grid gap-3">
						<TextField<V>
							name={path(item, "quote")}
							label={t("quote")}
							rows={3}
						/>
						<div className="grid gap-3 sm:grid-cols-2">
							<TextField<V> name={path(item, "author")} label={t("author")} />
							<TextField<V>
								name={path(item, "role")}
								label={t("role")}
								placeholder={t("rolePlaceholder")}
							/>
						</div>
						<MediaFormField<V>
							name={path(item, "photoId")}
							label={t("photo")}
						/>
					</div>
				);
			case "stats":
				return (
					<div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
						<TextField<V>
							name={path(item, "value")}
							label={t("value")}
							placeholder="350+"
						/>
						<TextField<V>
							name={path(item, "label")}
							label={t("label")}
							placeholder={t("labelPlaceholder")}
						/>
					</div>
				);
			case "faq":
				return (
					<div className="grid gap-3">
						<TextField<V> name={path(item, "question")} label={t("question")} />
						<TextField<V>
							name={path(item, "answer")}
							label={t("answer")}
							rows={3}
						/>
					</div>
				);
		}
	};

	return (
		<ItemList
			ids={fields.map((field) => field.id)}
			max={SECTION_LIMITS[kind]}
			addLabel={t(`add.${kind}`)}
			onAdd={() => append({ ...EMPTY_ITEM[kind] } as never)}
			onRemove={remove}
			onMove={move}
			renderItem={fieldsFor}
		/>
	);
}

/** A library video, or a YouTube / Vimeo link. */
function ShowreelEditor({ index }: { index: number }) {
	const t = useTranslations("Site.sections.fields");
	return (
		<div className="grid gap-3">
			<MediaFormField<V>
				name={`sections.${index}.mediaId` as `sections.${number}.title`}
				label={t("video")}
				type="video"
			/>
			<TextField<V>
				name={`sections.${index}.videoUrl` as `sections.${number}.title`}
				label={t("videoUrl")}
				description={t("videoUrlHint")}
				type="url"
				placeholder="https://www.youtube.com/watch?v=…"
			/>
		</div>
	);
}

/** What can be edited in a section besides its switch: heading and content. */
export function SectionContent({
	index,
	kind,
}: {
	index: number;
	kind: SectionKind;
}) {
	const t = useTranslations("Site.sections");
	return (
		<div className="flex flex-col gap-4">
			<TextField<V>
				name={`sections.${index}.title`}
				label={t("fields.title")}
				description={t("fields.titleHint")}
				placeholder={t(`kinds.${kind}.title`)}
				className="sm:max-w-sm"
			/>
			{kind === "showreel" && <ShowreelEditor index={index} />}
			{kind in SECTION_LIMITS && (
				<ListEditor index={index} kind={kind as ListKind} />
			)}
		</div>
	);
}
