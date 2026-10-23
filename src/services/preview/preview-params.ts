import { z } from "zod";
import { LOCALES } from "@/i18n/config";
import { SECTION_KINDS } from "@/services/site-sections/schemas";
import {
	FONT_PAIRS,
	SITE_TEMPLATES,
	THEME_MODES,
} from "@/services/studio/schemas";

export const PREVIEW_DATA = ["mine", "demo"] as const;
export type PreviewData = (typeof PREVIEW_DATA)[number];

// Every param is optional and falls back to undefined on bad input,
// so a mangled URL never breaks the preview.
export const previewParamsSchema = z.object({
	data: z.enum(PREVIEW_DATA).optional().catch(undefined),
	template: z.enum(SITE_TEMPLATES).optional().catch(undefined),
	accent: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.optional()
		.catch(undefined),
	font: z.enum(FONT_PAIRS).optional().catch(undefined),
	mode: z.enum(THEME_MODES).optional().catch(undefined),
	lang: z.enum(LOCALES).optional().catch(undefined),
	/** Set while sections are being edited: show the stored draft. */
	draft: z
		.string()
		.regex(/^d{1,15}$/)
		.optional()
		.catch(undefined),
	/** A section to scroll the preview to, e.g. the one being edited. */
	focus: z.enum(SECTION_KINDS).optional().catch(undefined),
});

export type PreviewParams = z.infer<typeof previewParamsSchema>;

/** Query string for /preview and /preview/frame (undefined values are skipped). */
export function previewQuery(params: PreviewParams) {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value) query.set(key, value);
	}
	return query.toString();
}
