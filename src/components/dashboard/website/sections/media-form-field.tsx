"use client";

import { createContext, useContext } from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";
import { MediaField } from "@/components/dashboard/media/media-field";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { MediaFilter } from "@/services/media/schemas";
import type { MediaItem } from "@/services/media/types";

/** The media the saved sections use, so each field can show its preview. */
export const SectionMediaContext = createContext<Record<string, MediaItem>>({});

/** A media id field (logo, photo, video) picked from the library. */
export function MediaFormField<T extends FieldValues>({
	name,
	label,
	type = "image",
}: {
	name: Path<T>;
	label: string;
	type?: MediaFilter;
}) {
	const { control } = useFormContext<T>();
	const media = useContext(SectionMediaContext);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="space-y-1.5">
					<FormLabel className="text-xs">{label}</FormLabel>
					<FormControl>
						<MediaField
							value={field.value}
							onChange={field.onChange}
							initialMedia={field.value ? (media[field.value] ?? null) : null}
							type={type}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
