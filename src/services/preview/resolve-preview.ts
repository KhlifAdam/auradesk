import "server-only";

import { getLocale } from "next-intl/server";
import { LOCALES } from "@/i18n/config";
import type { SiteDesign } from "@/services/studio/schemas";
import { buildDemoSite } from "../public-site/demo";
import { hasSiteContent, loadSiteData } from "../public-site/queries";
import type { SiteData } from "../public-site/types";
import { loadDraftBlocks } from "./draft-sections";
import { type PreviewParams, previewParamsSchema } from "./preview-params";

const DEFAULT_DESIGN: SiteDesign = {
	template: "MINIMAL",
	accentColor: "#c8a96e",
	fontPair: "MODERN",
	themeMode: "BOTH",
};

/**
 * Decides what the preview shows: real or demo content, which design (URL
 * overrides win, so unsaved choices can be previewed) and which language.
 */
export async function resolvePreview(
	photographerId: string,
	rawParams: Record<string, string | string[] | undefined>,
) {
	const params: PreviewParams = previewParamsSchema.parse(rawParams);
	const real = await loadSiteData(photographerId, [params.lang]);
	const hasContent = hasSiteContent(real);

	const saved = real?.design ?? DEFAULT_DESIGN;
	const design: SiteDesign = {
		template: params.template ?? saved.template,
		accentColor: params.accent ?? saved.accentColor,
		fontPair: params.font ?? saved.fontPair,
		themeMode: params.mode ?? saved.themeMode,
	};
	// Real content only makes sense when there is some; otherwise show the demo.
	const data = params.data ?? (hasContent ? "mine" : "demo");
	const useReal = data === "mine" && real !== null;

	const shown: SiteData = useReal
		? { ...real, design }
		: await buildDemoSite(design, {
				// The demo speaks every language, starting with the dashboard's.
				locale: params.lang ?? (await getLocale()),
				locales: [...LOCALES],
				defaultLocale: await getLocale(),
			});

	// Unsaved sections replace the saved ones while they are being edited.
	const draft = params.draft ? await loadDraftBlocks(photographerId) : null;
	const site: SiteData = draft ? { ...shown, sections: draft } : shown;

	return {
		params,
		site,
		data: useReal ? ("mine" as const) : ("demo" as const),
		design,
		savedDesign: real?.design ?? null,
		hasStudio: real !== null,
		hasContent,
	};
}
