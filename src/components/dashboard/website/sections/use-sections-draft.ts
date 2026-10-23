"use client";

import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { draftSiteSections } from "@/services/site-sections/actions";
import type {
	SectionKind,
	SectionsValues,
} from "@/services/site-sections/schemas";

const DRAFT_DELAY_MS = 500;

/** What the live preview shows of the sections being edited. */
export interface SectionsDraft {
	/** Changes on every stored draft (reloads the preview); null = saved. */
	token: string | null;
	/** The section last edited, to scroll the preview to. */
	focus?: SectionKind;
}

/**
 * Stores the unsaved sections a moment after each edit, so the live preview
 * can show them. A save or discard (a form reset) returns to the saved site.
 * Call `focusOn` before a change that names no field, like a reorder.
 */
export function useSectionsDraft(
	form: UseFormReturn<SectionsValues>,
	onDraft: (draft: SectionsDraft) => void,
) {
	const focusRef = useRef<SectionKind | undefined>(undefined);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		let latest = 0;

		const subscription = form.watch((_values, { name }) => {
			clearTimeout(timer);
			// A reset has no field name: the form matches the saved site again.
			if (!name) {
				latest++;
				return onDraft({ token: null });
			}
			const index = Number(name.split(".")[1]);
			if (Number.isInteger(index))
				focusRef.current = form.getValues(`sections.${index}.kind`);

			timer = setTimeout(async () => {
				const request = ++latest;
				const result = await draftSiteSections(form.getValues("sections"));
				// A newer draft or a reset happened meanwhile.
				if (request !== latest || !result.ok) return;
				onDraft({ token: String(Date.now()), focus: focusRef.current });
			}, DRAFT_DELAY_MS);
		});
		return () => {
			clearTimeout(timer);
			subscription.unsubscribe();
		};
	}, [form, onDraft]);

	return {
		focusOn: (kind: SectionKind) => {
			focusRef.current = kind;
		},
	};
}
