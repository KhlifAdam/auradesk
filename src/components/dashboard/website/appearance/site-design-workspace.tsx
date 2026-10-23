"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type PreviewParams,
	previewQuery,
} from "@/services/preview/preview-params";
import type { SectionsEditorData } from "@/services/site-sections/queries";
import type { StudioData } from "@/services/studio/types";
import { SectionsEditor } from "../sections/sections-editor";
import type { SectionsDraft } from "../sections/use-sections-draft";
import { AppearanceForm } from "./appearance-form";
import { AppearancePreviewPanel } from "./appearance-preview-panel";

const DESIGN_TABS = ["style", "sections"] as const;
export type DesignTab = (typeof DESIGN_TABS)[number];

/**
 * The site's look (style) and its content blocks (sections), side by side
 * with one live preview that shows the unsaved changes of both. Each tab
 * saves on its own; both stay mounted so switching keeps unsaved edits.
 */
export function SiteDesignWorkspace({
	studio,
	sections,
	initialTab,
	siteUrl,
}: {
	studio: StudioData;
	sections: SectionsEditorData;
	initialTab: DesignTab;
	/** The live site, when it is published. */
	siteUrl: string | null;
}) {
	const t = useTranslations("Site.appearance");
	const [tab, setTab] = useState<DesignTab>(initialTab);
	// Starts as saved, so the first frame doesn't reload once the form reports.
	const [design, setDesign] = useState<PreviewParams>({
		template: studio.template,
		accent: studio.accentColor,
		font: studio.fontPair,
		mode: studio.themeMode,
		lang: studio.defaultLocale,
	});
	const [draft, setDraft] = useState<SectionsDraft>({ token: null });

	function changeTab(value: string) {
		const next = value as DesignTab;
		setTab(next);
		// Keep the tab in the URL (shareable, survives a refresh).
		const url = new URL(window.location.href);
		url.searchParams.set("tab", next);
		window.history.replaceState(null, "", url);
	}

	const query = previewQuery({ ...design, draft: draft.token ?? undefined });

	return (
		<Tabs value={tab} onValueChange={changeTab}>
			<div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<div className="flex items-center justify-between gap-2">
						<TabsList>
							{DESIGN_TABS.map((value) => (
								<TabsTrigger key={value} value={value} className="text-xs">
									{t(`tabs.${value}`)}
								</TabsTrigger>
							))}
						</TabsList>
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
					</div>
					<TabsContent
						value="style"
						forceMount
						className="mt-0 data-[state=inactive]:hidden"
					>
						<AppearanceForm studio={studio} onPreviewChange={setDesign} />
					</TabsContent>
					<TabsContent
						value="sections"
						forceMount
						className="mt-0 data-[state=inactive]:hidden"
					>
						<SectionsEditor data={sections} onDraft={setDraft} />
					</TabsContent>
				</div>
				<AppearancePreviewPanel
					query={query}
					focus={tab === "sections" ? draft.focus : undefined}
				/>
			</div>
		</Tabs>
	);
}
